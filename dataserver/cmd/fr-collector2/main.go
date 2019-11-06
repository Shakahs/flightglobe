package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/app/fr-collector/flightradar24"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/ThreeDotsLabs/watermill"
	"github.com/ThreeDotsLabs/watermill-nats/pkg/nats"
	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/message/router/middleware"
	"github.com/ThreeDotsLabs/watermill/message/router/plugin"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
	"github.com/nats-io/stan.go"
	"log"
	"os"
	"time"
)

var (
	// For this example, we're using just a simple logger implementation,
	// You probably want to ship your own implementation of `watermill.LoggerAdapter`.
	logger          = watermill.NewStdLogger(false, false)
	incomingChannel = pkg.FR_RAW_DATA
	outgoingChannel = pkg.FR_PROCESSED_DATA
	natsAddress     = os.Getenv("NATS_ADDRESS")
)

func init() {
	pkg.CheckEnvVars(natsAddress)
}

func publishMessages(publisher message.Publisher) {

	for {
		scrapeUrl := fmt.Sprintf(flightradar24.URL_TEMPLATE, 80.0, -80.0, 90.0, -90.0)
		log.Println("Scraping data from", scrapeUrl)
		rawData := flightradar24.Retrieve(scrapeUrl)

		msg := message.NewMessage(watermill.NewUUID(), rawData)
		middleware.SetCorrelationID(watermill.NewUUID(), msg)

		if err := publisher.Publish(incomingChannel, msg); err != nil {
			panic(err)
		}

		time.Sleep(time.Second * 15)
	}

}

func FrHandler(msg *message.Message) ([]*message.Message, error) {
	rawRecords := flightradar24.DecodeRaw(msg.Payload)
	unfilteredRecords := flightradar24.Transform(rawRecords)
	standardizedRecords := pkg.Filter(unfilteredRecords)

	var outgoingData []*message.Message
	count := 0

	for _, r := range standardizedRecords {
		encoded, err := json.Marshal(r)
		pkg.Check(err)

		newMsg := message.NewMessage(watermill.NewUUID(), encoded)
		middleware.SetCorrelationID(middleware.MessageCorrelationID(msg), newMsg)

		outgoingData = append(outgoingData, newMsg)
		count++
	}

	log.Printf("FrHandler processed %d valid records from %d input records", count, len(unfilteredRecords))

	return outgoingData, nil
}

func main() {
	router, err := message.NewRouter(message.RouterConfig{}, logger)
	if err != nil {
		panic(err)
	}

	router.AddPlugin(plugin.SignalsHandler)
	router.AddMiddleware(
		middleware.CorrelationID,
		middleware.Recoverer,
	)

	localPubSub := gochannel.NewGoChannel(gochannel.Config{}, logger)

	natsDSN := fmt.Sprintf("nats://%s:4222", natsAddress)
	log.Println("connecting to NATS at", natsDSN)

	remotePubSub, err := nats.NewStreamingPublisher(
		nats.StreamingPublisherConfig{
			ClusterID: "test-cluster",
			ClientID:  "example-publisher",
			StanOptions: []stan.Option{
				stan.NatsURL(natsDSN),
			},
			Marshaler: nats.GobMarshaler{},
		},
		watermill.NewStdLogger(false, false),
	)
	pkg.Check(err)

	router.AddHandler(
		"FlightRadar24_Processing", // handler name, must be unique
		incomingChannel,            // topic from which we will read events
		localPubSub,
		outgoingChannel, // topic to which we will publish events
		remotePubSub,
		FrHandler,
	)

	go publishMessages(localPubSub)

	ctx := context.Background()
	if err := router.Run(ctx); err != nil {
		panic(err)
	}
}
