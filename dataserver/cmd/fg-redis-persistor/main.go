package main

import (
	"context"
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/ThreeDotsLabs/watermill"
	"github.com/ThreeDotsLabs/watermill-nats/pkg/nats"
	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/message/router/middleware"
	"github.com/ThreeDotsLabs/watermill/message/router/plugin"
	"github.com/go-redis/redis"
	"github.com/nats-io/stan.go"
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
	natsAddress     = os.Getenv("NATS_ADDRESS")
)

func init() {
	//redisSubChannel = os.Getenv("REDIS_SUB_CHANNEL")
	//redisPubChannel = os.Getenv("REDIS_PUB_CHANNEL")
	//
	pkg.CheckEnvVars(redisAddress, redisPort, natsAddress)
	//
	redisClient = pkg.ProvideRedisClient(redisAddress, redisPort)
}

func persistor(msg *message.Message) error {
	log.Println("redis persistor received message", msg.UUID)
	return nil
}

func main() {
	//go redis_point_persistor.Persist(redisClient, redisSubChannel, redisPubChannel)

	router, err := message.NewRouter(message.RouterConfig{}, logger)
	if err != nil {
		panic(err)
	}

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

	natsDSN := fmt.Sprintf("nats://%s:4222", natsAddress)
	log.Println("connecting to NATS at", natsDSN)
	remotePubSub, err := nats.NewStreamingSubscriber(
		nats.StreamingSubscriberConfig{
			ClusterID:        "test-cluster",
			ClientID:         "redis-persistor",
			QueueGroup:       "example",
			DurableName:      "my-durable",
			SubscribersCount: 1, // how many goroutines should consume messages
			CloseTimeout:     time.Minute,
			AckWaitTimeout:   time.Second * 30,
			StanOptions: []stan.Option{
				stan.NatsURL(natsDSN),
			},
			Unmarshaler: nats.GobMarshaler{},
		},
		watermill.NewStdLogger(false, false),
	)
	pkg.Check(err)

	router.AddNoPublisherHandler("Redis_Persistor", incomingChannel, remotePubSub, persistor)

	ctx := context.Background()
	if err := router.Run(ctx); err != nil {
		panic(err)
	}
}
