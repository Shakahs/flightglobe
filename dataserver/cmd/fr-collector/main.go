package main

import (
	"encoding/json"
	"fmt"
	"github.com/KromDaniel/rejonson"
	"github.com/Shakahs/flightglobe/dataserver/internal/app/fr-collector/flightradar24"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/robfig/cron"
	"os"
	"os/signal"
	"syscall"
)

var redisPubChannel = os.Getenv("REDIS_PUB_CHANNEL")
var redisDataKey = os.Getenv("REDIS_DATA_KEY")

func publishPosition(allpos pkg.Positions, c *rejonson.Client){
	published := 0
	for _, pos := range(allpos){
		marshaled, err := json.Marshal(pos)
		if err == nil {
			err = c.Publish(redisPubChannel,  string(marshaled[:])).Err()
			if err != nil {
				panic(err)
			}
		}
		published++
	}
	fmt.Println("published", published, "positions downstream")
}

func publishPositions(inChan chan pkg.Positions, c *rejonson.Client) {
	for {
		select {
		case r := <-inChan:
			publishPosition(r, c)
		}
	}
}

func main() {

	redisPubChannel := os.Getenv("REDIS_PUB_CHANNEL")
	redisDataKey := os.Getenv("REDIS_DATA_KEY")
	redisAddress := os.Getenv("REDIS_ADDRESS")
	redisPort := os.Getenv("REDIS_PORT")

	for _,v := range([]string{redisPubChannel, redisDataKey, redisAddress, redisPort}) {
		if v == "" {
			panic(fmt.Sprintf("%s env variable not provided", v))
		}
	}

	var redisdb = pkg.ProvideReJSONClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))

	err := pkg.EnsureJSONKeyExists(redisdb, redisDataKey)
	if err != nil {
		panic("Unable to ensure critical JSON key exists")
	}

	rawData := make(chan []byte)

	doScrape := func() {
		pMap := pkg.GetPositionMap(redisdb, redisDataKey)
		flightradar24.Scrape(pMap, rawData)
	}

	go doScrape()

	cleanData := make(chan pkg.Positions)
	go flightradar24.Clean(rawData, cleanData)

	go publishPositions(cleanData, redisdb)

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
