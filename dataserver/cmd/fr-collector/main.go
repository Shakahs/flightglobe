package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/lib"
	"github.com/Shakahs/flightglobe/dataserver/lib/flightradar24"
	"github.com/robfig/cron"
	"os"
	"os/signal"
	"syscall"
	"encoding/json"
)

var redisdb = lib.ProvideRedisClient()

var redisPubChannel = os.Getenv("REDIS_PUB_CHANNEL")

func publishPosition(allpos lib.Positions){
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
	fmt.Println("published", published, "positions")
}

func PublishPositions(inChan chan lib.Positions) {
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

	rawData := make(chan []byte)
	go flightradar24.Scrape(rawData)

	cleanData := make(chan lib.Positions)
	go flightradar24.Clean(rawData, cleanData)

	go PublishPositions(cleanData)

	scheduler := cron.New()
	scheduler.AddFunc("@every 30s", func() { flightradar24.Scrape(rawData) })
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
