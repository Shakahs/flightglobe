package main

import (
	"encoding/json"
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/app/fr-collector/flightradar24"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/robfig/cron"
	"os"
	"os/signal"
	"syscall"
)

var redisdb = pkg.ProvideReJSONClient()

var redisPubChannel = os.Getenv("REDIS_PUB_CHANNEL")
var redisDataKey = os.Getenv("REDIS_DATA_KEY")

func publishPosition(allpos pkg.Positions){
	published := 0
	for _, pos := range(allpos){
		marshaled, err := json.Marshal(pos)
		if err == nil {
			err = redisdb.Publish(redisPubChannel,  string(marshaled[:])).Err()
			if err != nil {
				panic(err)
			}
		}
		published++
	}
	fmt.Println("published", published, "positions downstream")
}

func publishPositions(inChan chan pkg.Positions) {
	for {
		select {
		case r := <-inChan:
			publishPosition(r)
		}
	}
}

func main() {

	if redisPubChannel == "" {
		panic("redisPubChannel env variable missing")
	}

	if redisDataKey == "" {
		panic("redisDataKey env variable missing")
	}

	rawData := make(chan []byte)

	doScrape := func() {
		pMap := pkg.GetPositionMap(redisdb, redisDataKey)
		flightradar24.Scrape(pMap, rawData)
	}

	go doScrape()

	cleanData := make(chan pkg.Positions)
	go flightradar24.Clean(rawData, cleanData)

	go publishPositions(cleanData)

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
