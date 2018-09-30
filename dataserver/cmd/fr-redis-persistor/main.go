package main

import (
	"encoding/json"
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/lib"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

var reJsonClient = lib.ProvideReJSONClient()

var redisSubChannel = os.Getenv("REDIS_SUB_CHANNEL")
var redisDataKey = os.Getenv("REDIS_DATA_KEY")

func checkKeyExists() {
	if reJsonClient.Exists(redisDataKey).Val() == 0 {
		_, err := reJsonClient.JsonSet(redisDataKey, ".", "{}").Result()
		if err != nil {
			panic(err)
		}
		fmt.Println("Key", redisDataKey, "did not exist, was created")
	} else {
		fmt.Println("Confirmed that key", redisDataKey, "exists")
	}
}

func persist() {
	pubsub := reJsonClient.Subscribe(redisSubChannel)
	ch := pubsub.Channel()

	ticker := time.NewTicker(time.Second * 5)
	defer ticker.Stop()

	persistedCount := 0

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				break
			}

			//deserialize so we can get the ICAO.
			var pos lib.Position
			err := json.Unmarshal([]byte(msg.Payload), &pos) //get msg string, convert to byte array for unmarshal
			if err != nil {
				log.Fatal("unmarshal error", err)
			}

			//only persist if we have an ICAO, persisting an empty ICAO erases the ReJSON container
			if pos.Icao != "" {
				reJsonClient.JsonSet(redisDataKey, fmt.Sprintf(".%s", pos.Icao), msg.Payload)
				persistedCount++
			}
		case <-ticker.C:
			fmt.Println(persistedCount, "positions saved in past 5 seconds")
			persistedCount = 0
		}
	}
}

func main() {

	if redisSubChannel == "" || redisDataKey == "" {
		panic("Required env variable missing")
	}

	checkKeyExists()
	go persist()

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
			return
		}
	}
}
