package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/app/fr-collector/flightradar24"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/ThreeDotsLabs/watermill"
	"github.com/ThreeDotsLabs/watermill-amqp/pkg/amqp"
	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/message/router/middleware"
	"github.com/ThreeDotsLabs/watermill/message/router/plugin"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
	"github.com/go-redis/redis"
	"github.com/paulbellamy/ratecounter"
	"github.com/prometheus/common/log"
	"github.com/robfig/cron"
	"os"
	"time"
)

var (
	// For this example, we're using just a simple logger implementation,
	// You probably want to ship your own implementation of `watermill.LoggerAdapter`.
	logger          = watermill.NewStdLogger(false, false)
	incomingChannel = pkg.FR_RAW_DATA
	outgoingChannel = pkg.FR_PROCESSED_DATA
	redisAddress    = os.Getenv("REDIS_ADDRESS")
	redisPort       = os.Getenv("REDIS_PORT")
	redisClient     *redis.Client
	amqpURI         = fmt.Sprintf("amqp://user:secretpassword@%s:%s/",
		os.Getenv("RABBITMQ_HOST"),
		os.Getenv("RABBITMQ_PORT"))
	counter           = ratecounter.NewRateCounter(30 * time.Second)
	livenessProbeFile = "/tmp/fr-collector2-live"
)

func init() {
	pkg.CheckEnvVars(redisAddress, redisPort,
		os.Getenv("RABBITMQ_HOST"),
		os.Getenv("RABBITMQ_PORT"))
	redisClient = pkg.ProvideRedisClient(redisAddress, redisPort)

	//wait here until Redis connects
	redisConnected := false
	for redisConnected == false {
		_, err := redisClient.Ping().Result()
		if err == nil {
			redisConnected = true
			log.Info("Connected to Redis")
		} else {
			log.Info("Waiting to connect to Redis...")
			time.Sleep(time.Second * 5)
		}
	}
}

func getPositions() *pkg.LockableRecordMap {
	var cursor uint64
	var icaoList []string

	for {
		var keys []string
		var err error
		keys, cursor, err = redisClient.Scan(cursor, "position:*", 10).Result()
		if err != nil {
			panic(err)
		}

		for _, v := range keys {
			icaoList = append(icaoList, v)
		}

		if cursor == 0 {
			break
		}
	}

	var rmap = pkg.CreateCache()
	for _, v := range icaoList {
		rawPos, err := redisClient.Get(v).Bytes()
		if err == nil {
			var frecord pkg.FlightRecord
			err = json.Unmarshal(rawPos, &frecord)
			pkg.Check(err)

			rmap.SavePosition(&frecord)
		}
	}

	return rmap
}

func publishMessages(publisher message.Publisher) {
	for {
		rmap := getPositions()
		urlList := flightradar24.BuildUrlList(rmap.GetPositions())
		//log.Println(urlList)
		delay := 29 / len(urlList)

		for _, v := range urlList {
			rawData, err := flightradar24.Retrieve(v)

			if err == nil {
				msg := message.NewMessage(watermill.NewUUID(), rawData)
				middleware.SetCorrelationID(watermill.NewUUID(), msg)

				publisher.Publish(incomingChannel, msg)

			}
			time.Sleep(time.Duration(delay) * time.Second)
		}

		time.Sleep(time.Second * 30)
	}
}

func FrHandler(msg *message.Message) ([]*message.Message, error) {
	rawRecords := flightradar24.DecodeRaw(msg.Payload)
	unfilteredRecords := flightradar24.Transform(rawRecords)
	standardizedRecords := pkg.Filter(unfilteredRecords)

	var outgoingData []*message.Message

	for _, r := range standardizedRecords {
		encoded, err := json.Marshal(r)
		pkg.Check(err)

		newMsg := message.NewMessage(watermill.NewUUID(), encoded)
		middleware.SetCorrelationID(middleware.MessageCorrelationID(msg), newMsg)

		outgoingData = append(outgoingData, newMsg)
		counter.Incr(1)
	}

	return outgoingData, nil
}

func updateLiveness() error {
	touchError := pkg.TouchFile(livenessProbeFile)
	if touchError != nil {
		return touchError
	}

	return nil
}

func updateLivenessAfterMessage(_ *message.Message) error {
	touchError := updateLiveness()
	if touchError != nil {
		return touchError
	}

	return nil
}

//this is what scrapes FR and publishes it to PubSub via Watermill
func configureCollection(r *message.Router) *message.Router {
	localPubSub := gochannel.NewGoChannel(gochannel.Config{}, logger)

	remotePubSubConnected := false
	err := error(nil)
	var remotePubSub *amqp.Publisher
	//wait here until AMQP connects
	for remotePubSubConnected == false {
		remotePubSub, err = amqp.NewPublisher(
			amqp.NewNonDurablePubSubConfig(amqpURI, amqp.GenerateQueueNameTopicName),
			watermill.NewStdLogger(false, false))
		if err == nil {
			remotePubSubConnected = true
		} else {
			log.Warn(err)
		}
	}

	r.AddHandler(
		"FlightRadar24_Collector", // handler name, must be unique
		incomingChannel,           // topic from which we will read events
		localPubSub,
		outgoingChannel, // topic to which we will publish events
		remotePubSub,
		FrHandler,
	)

	go publishMessages(localPubSub)

	return r
}

//this subscribes to the same PubSub stream just to verify that we are actually publishing
func configureCollectionMonitoring(r *message.Router) *message.Router {

	remotePubSub, _ := amqp.NewSubscriber(
		amqp.NewNonDurablePubSubConfig(amqpURI, amqp.GenerateQueueNameTopicName),
		watermill.NewStdLogger(false, false))

	r.AddNoPublisherHandler("FlightRadar24_Collector_Verifier",
		outgoingChannel,
		remotePubSub,
		updateLivenessAfterMessage)

	return r
}

func main() {

	router, err := message.NewRouter(message.RouterConfig{}, logger)
	if err != nil {
		panic(err)
	}

	configureCollection(router)
	configureCollectionMonitoring(router)

	router.AddPlugin(plugin.SignalsHandler)
	router.AddMiddleware(
		middleware.CorrelationID,
		middleware.Recoverer,
		middleware.Timeout(time.Second*10),
	)

	c := cron.New()
	err = c.AddFunc("@every 30s", func() {
		fmt.Println(fmt.Sprintf("Published %d items in the past 30s", counter.Rate()))
	})
	pkg.Check(err)
	c.Start()

	ctx := context.Background()
	if err := router.Run(ctx); err != nil {
		panic(err)
	}
}
