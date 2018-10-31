package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/app/fr-collector/flightradar24"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/robfig/cron"
	"os"
	"os/signal"
	"syscall"
)

var redisPubChannel string
var redisSubChannel string
var redisAddress string
var redisPort string
var positionCache *pkg.LockableRecordMap

func init() {
	redisPubChannel = os.Getenv("REDIS_PUB_CHANNEL")
	redisSubChannel = os.Getenv("REDIS_SUB_CHANNEL")
	redisAddress = os.Getenv("REDIS_ADDRESS")
	redisPort = os.Getenv("REDIS_PORT")

	pkg.CheckEnvVars(redisPubChannel, redisSubChannel, redisAddress, redisPort)

	positionCache = pkg.CreateCache()
}

func main() {
	var redisdb = pkg.ProvideRedisClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))

	go pkg.CachePositions(redisdb, redisSubChannel, positionCache)

	rawData := make(chan []byte)
	doScrape := func() {
		positionList := positionCache.GetPositions()
		flightradar24.Scrape(positionList, rawData)
	}

	go doScrape()
	cleanData := make(chan pkg.FlightRecords)
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
		case <-sigc:
			fmt.Println("Received signal, quitting")
			scheduler.Stop()
			return
		}
	}
}
