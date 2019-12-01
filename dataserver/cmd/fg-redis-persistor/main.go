package main

import (
	"context"
	"encoding/json"
	"fmt"
	fg_redis_persistor "github.com/Shakahs/flightglobe/dataserver/internal/app/fg-redis-persistor"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/ThreeDotsLabs/watermill"
	"github.com/ThreeDotsLabs/watermill-amqp/pkg/amqp"
	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/message/router/middleware"
	"github.com/ThreeDotsLabs/watermill/message/router/plugin"
	"github.com/go-redis/redis"
	"github.com/paulbellamy/ratecounter"
	"github.com/robfig/cron"
	"log"
	"os"
	"time"
)

var (
	//redisSubChannel string
	//redisPubChannel string
	redisAddress = os.Getenv("REDIS_ADDRESS")
	redisPort    = os.Getenv("REDIS_PORT")
	redisClient  *redis.Client
	// For this example, we're using just a simple logger implementation,
	// You probably want to ship your own implementation of `watermill.LoggerAdapter`.
	logger          = watermill.NewStdLogger(false, false)
	incomingChannel = pkg.FR_PROCESSED_DATA
	amqpURI         = fmt.Sprintf("amqp://user:secretpassword@%s:%s/",
		os.Getenv("RABBITMQ_HOST"),
		os.Getenv("RABBITMQ_PORT"))
	counter = ratecounter.NewRateCounter(30 * time.Second)
)

func init() {
	//redisSubChannel = os.Getenv("REDIS_SUB_CHANNEL")
	//redisPubChannel = os.Getenv("REDIS_PUB_CHANNEL")
	//
	pkg.CheckEnvVars(redisAddress, redisPort,
		os.Getenv("RABBITMQ_HOST"),
		os.Getenv("RABBITMQ_PORT"))
	//
	redisClient = pkg.ProvideRedisClient(redisAddress, redisPort)
}

func persistor(msg *message.Message) error {

	var newPos pkg.FlightRecord
	err := json.Unmarshal(msg.Payload, &newPos)
	if err != nil {
		return err
	}

	err = fg_redis_persistor.PersistCore(redisClient, &newPos, string(msg.Payload))
	if err != nil {
		log.Println("persistor error:", err)
		return err
	} else {
		counter.Incr(1)
	}
	return nil
}

func main() {
	router, err := message.NewRouter(message.RouterConfig{}, logger)
	if err != nil {
		panic(err)
	}

	remotePubSub, err := amqp.NewSubscriber(
		amqp.NewNonDurablePubSubConfig(amqpURI, amqp.GenerateQueueNameTopicName),
		watermill.NewStdLogger(false, false))
	if err != nil {
		panic(err)
	}
	pkg.Check(err)

	router.AddNoPublisherHandler("Redis_Persistor", incomingChannel, remotePubSub, persistor)

	router.AddPlugin(plugin.SignalsHandler)
	router.AddMiddleware(
		// CorrelationID will copy the correlation id from the incoming message's metadata to the produced messages
		middleware.CorrelationID,

		// The handler function is retried if it returns an error.
		// After MaxRetries, the message is Nacked and it's up to the PubSub to resend it.
		middleware.Retry{
			MaxRetries:      3,
			InitialInterval: time.Millisecond * 100,
			Logger:          logger,
		}.Middleware,

		// Recoverer handles panics from handlers.
		// In this case, it passes them as errors to the Retry middleware.
		middleware.Recoverer,
	)

	c := cron.New()
	err = c.AddFunc("@every 30s", func() {
		fmt.Println(fmt.Sprintf("Processed %d items in the past 30s", counter.Rate()))
	})
	pkg.Check(err)
	c.Start()

	ctx := context.Background()
	if err := router.Run(ctx); err != nil {
		panic(err)
	}
}
