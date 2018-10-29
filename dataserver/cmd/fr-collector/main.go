package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/app/fr-collector/flightradar24"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/patrickmn/go-cache"
	"github.com/robfig/cron"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

var redisPubChannel string
var redisSubChannel string
var redisAddress string
var redisPort string
var positionCache *cache.Cache

func init() {
	redisPubChannel = os.Getenv("REDIS_PUB_CHANNEL")
	redisSubChannel = os.Getenv("REDIS_SUB_CHANNEL")
	redisAddress = os.Getenv("REDIS_ADDRESS")
	redisPort = os.Getenv("REDIS_PORT")

	pkg.CheckEnvVars(redisPubChannel, redisSubChannel, redisAddress, redisPort)

	positionCache = cache.New(5*time.Minute, 6*time.Minute)
}

func main() {
	var redisdb = pkg.ProvideRedisClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))

	pubsub := redisdb.Subscribe(redisSubChannel)
	ch := pubsub.Channel()

	rawData := make(chan []byte)
	doScrape := func() {
		pMap, err := pkg.RetrievePositionsFromCache(positionCache)
		if err != nil {
			log.Fatal(err)
		}
		flightradar24.Scrape(pMap, rawData)
	}

	go doScrape()
	cleanData := make(chan pkg.Positions)
	go flightradar24.Clean(rawData, cleanData)
	go pkg.PublishPositionsFromChan(cleanData, redisdb, redisPubChannel)

	scheduler := cron.New()
	scheduler.AddFunc("@every 30s", doScrape)
	scheduler.Start()

	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc,
		syscall.SIGHUP,
		syscall.SIGINT,
		syscall.SIGTERM,
		syscall.SIGQUIT)

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				break
			}

			pkg.SavePositionToCache(positionCache, msg.Payload)

		case <-sigc:
			fmt.Println("Received signal, quitting")
			scheduler.Stop()
			return
		}
	}
}
