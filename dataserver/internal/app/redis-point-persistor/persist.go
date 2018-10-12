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

func persistTrack(c *rejonson.Client, pos pkg.Position, rawPos string) error {
	trackKey := fmt.Sprintf("track:$%s", pos.Icao)
	_, err := pkg.EnsureJSONKeyExists(c, trackKey, "[]")
	if err != nil {
		return err
	}

	var track pkg.Positions
	rawTrack, err := c.JsonGet(trackKey).Bytes()
	if err != nil {
		return err
	}

	err = json.Unmarshal(rawTrack, &track)
	if err != nil {
		return err
	}

	if shouldSaveTrack(track, pos) { //compare last element of existing track to this new element
		_, err = c.JsonArrAppend(trackKey, ".", rawPos).Result()
		if err != nil {
			return err
		}
	}

	return nil
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
					log.Println("Encountered an error saving position for ", pos.Icao)
				}

				err = persistTrack(c, pos, msg.Payload)
				if err != nil {
					log.Println("Encountered an error saving track for ", pos.Icao)
				}

				persistedCount++
			} else {
				droppedCount++
			}
		case <-ticker.C:
			fmt.Println(persistedCount, "positions saved,", droppedCount, "positions dropped in past 5 seconds")
			persistedCount = 0
			droppedCount = 0

			//ensure the primary data key exists (if Redis loses data) without checking it on every Position set
			_, err := pkg.EnsureJSONKeyExists(c, redisDataKey, "{}")
			if err != nil {
				log.Fatal("Unable to ensure required key exists")
			}
		}
	}
}
