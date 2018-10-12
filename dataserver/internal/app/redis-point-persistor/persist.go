package redis_point_persistor

import (
	"encoding/json"
	"fmt"
	"github.com/KromDaniel/rejonson"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"log"
	"time"
)

func shouldSaveTrack(track pkg.Positions, new pkg.Position) bool {
	if len(track) == 0 {
		return true
	} //empty track
	old := track[len(track)-1] //get last recorded position
	if old.Latitude == new.Latitude && old.Longitude == new.Longitude {
		return false
	} //identical coordinates
	delta := new.Time.Sub(old.Time)
	if delta.Minutes() < 1 {
		return false
	} //less than 1 minute difference
	return true
}

func persistLatestPosition(c *rejonson.Client, redisDataKey string, pos pkg.Position, rawPos string) error {
	_, err := c.JsonSet(redisDataKey, fmt.Sprintf(".$%s", pos.Icao), rawPos).Result()
	return err
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

	if shouldSaveTrack(track, pos) { //compare last element of existing track to this new element
		_, err = c.JsonArrAppend(trackKey, ".", rawPos).Result()
		if err != nil {
			fmt.Println("Unable to append track to Redis JSON array", trackKey)
			panic(err)
		}
	}
}

func Persist(c *rejonson.Client, redisSubChannel string, redisDataKey string) {
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
				err := persistLatestPosition(c, redisDataKey, pos, msg.Payload)
				if err != nil {
					log.Fatal()
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
