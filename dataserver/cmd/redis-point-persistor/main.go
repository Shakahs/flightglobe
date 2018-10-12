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

func shouldSaveTrack(track pkg.Positions, new pkg.Position) bool {
	if len(track) == 0 {return true} //empty track
	old := track[len(track)-1] //get last recorded position
	if old.Lat == new.Lat && old.Lng == new.Lng {return false} //identical coordinates
	delta := new.Time.Sub(old.Time)
	if delta.Minutes() < 1 {return false} //less than 1 minute difference
	return true
}

func persistTrack(c *rejonson.Client, pos pkg.Position, rawPos string) {
	trackKey := fmt.Sprintf("track:$%s", pos.Icao)
	_, err := pkg.EnsureJSONKeyExists(c, trackKey, "[]")
	if err != nil {
		fmt.Println("Unable to ensure track key exists", trackKey)
		panic(err)
	}

	var track pkg.Positions
	rawTrack, err := c.JsonGet(trackKey).Bytes()
	if err != nil {
		fmt.Println("Unable to retrieve track", trackKey)
		panic(err)
	}

	err = json.Unmarshal(rawTrack, &track)
	if err != nil {
		fmt.Println(string(rawTrack))
		fmt.Println("Unable to unmarshal track from JSON", trackKey)
		panic(err)
	}

	if shouldSaveTrack(track, pos){ //compare last element of existing track to this new element
		_, err = c.JsonArrAppend(trackKey, ".", rawPos).Result()
		if err != nil {
			fmt.Println("Unable to append track to Redis JSON array", trackKey)
			panic(err)
		}
	}
}

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

				persistTrack(c, pos, msg.Payload)

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

	for _,v := range([]string{redisSubChannel, redisDataKey, redisAddress, redisPort}) {
		if v == "" {
			panic("Required env variable missing")
		}
	}

	reJsonClient := pkg.ProvideReJSONClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))

	_, err := pkg.EnsureJSONKeyExists(reJsonClient, redisDataKey, "{}")
	if err != nil {
		panic("Unable to ensure required key exists")
	}

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
