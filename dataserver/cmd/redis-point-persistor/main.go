package main

import (
	"encoding/json"
	"fmt"
	"github.com/KromDaniel/rejonson"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func persist(c *rejonson.Client, redisSubChannel string,redisDataKey string ) {
	pubsub := c.Subscribe(redisSubChannel)
	ch := pubsub.Channel()

	ticker := time.NewTicker(time.Second * 5)
	defer ticker.Stop()

	persistedCount := 0
	droppedCount := 0

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				break
			}

			//deserialize so we can get the ICAO.
			var pos pkg.Position
			err := json.Unmarshal([]byte(msg.Payload), &pos) //get msg string, convert to byte array for unmarshal
			if err != nil {
				log.Fatal("unmarshal error", err)
			}

			//only persist if we have an ICAO, persisting an empty ICAO erases the ReJSON container
			if pos.Icao != "" {
				_, err := c.JsonSet(redisDataKey, fmt.Sprintf(".$%s", pos.Icao), msg.Payload).Result()
				if err != nil {
					fmt.Println("Payload:",pos.Icao, pos)
					panic(err)
				}
				persistedCount++
			} else {
				droppedCount++
			}
		case <-ticker.C:
			fmt.Println(persistedCount, "positions saved,", droppedCount, "positions dropped in past 5 seconds")
			persistedCount = 0
			droppedCount = 0
		}
	}
}

func main() {

	for _, pair := range os.Environ() {
		fmt.Println(pair)
	}

	 redisSubChannel := os.Getenv("REDIS_SUB_CHANNEL")
	 redisDataKey := os.Getenv("REDIS_DATA_KEY")
	 redisAddress := os.Getenv("REDIS_ADDRESS")
	 redisPort := os.Getenv("REDIS_PORT")

	if redisSubChannel == "" || redisDataKey == "" {
		panic("Required env variable missing")
	}

	reJsonClient := pkg.ProvideReJSONClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))

	pkg.EnsureJSONKeyExists(reJsonClient, redisDataKey)
	go persist(reJsonClient, redisSubChannel, redisDataKey)

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