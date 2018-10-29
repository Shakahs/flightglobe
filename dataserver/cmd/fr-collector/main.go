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

func checkEnvVars(vars ...string)  {
	for _,v := range vars {
		if v == "" {
			panic("Required env variable not provided")
		}
	}
}

func init() {
	redisPubChannel = os.Getenv("REDIS_PUB_CHANNEL")
	redisSubChannel = os.Getenv("REDIS_SUB_CHANNEL")
	redisAddress = os.Getenv("REDIS_ADDRESS")
	redisPort = os.Getenv("REDIS_PORT")

	checkEnvVars(redisPubChannel, redisSubChannel, redisAddress, redisPort)
}

func main() {
	//var redisdb = pkg.ProvideRedisClient(fmt.Sprintf("%s:%s",
	//	redisAddress, redisPort))

	rawData := make(chan []byte)

	doScrape := func() {
		//pMap := pkg.GetPositionMap(redisdb, redisDataKey)
		var pMap pkg.SinglePositionDataset
		flightradar24.Scrape(pMap, rawData)
	}

	go doScrape()

	cleanData := make(chan pkg.Positions)
	go flightradar24.Clean(rawData, cleanData)

	//go pkg.PublishPositions(cleanData, redisdb, redisPubChannel)

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
