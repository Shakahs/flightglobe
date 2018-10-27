package redis_point_persistor

import (
	"encoding/json"
	"fmt"
	"github.com/KromDaniel/rejonson"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/pkg/errors"
	"log"
	"time"
)

func isPositionValid(newPos pkg.Position) bool {
	if newPos.Icao == "" {
		return false
	} //blank ICAO

	return true
}

func arePositionsIdentical(oldPos pkg.Position, newPos pkg.Position) bool {
	if oldPos.Latitude == newPos.Latitude && oldPos.Longitude == newPos.Longitude {
		return true
	} //identical coordinates

	return false
}

func shouldSavePosition(oldPos pkg.Position, newPos pkg.Position) bool {
	if !isPositionValid(newPos) {
		return false
	} //failed validation

	if arePositionsIdentical(oldPos, newPos) {
		return false
	} //identical coordinates
	return true
}

func shouldSaveTrackPosition(track pkg.Positions, newPos pkg.Position) bool {
	if !isPositionValid(newPos) {
		return false
	} //failed validation

	if len(track) == 0 {
		return true
	} //empty track

	oldPos := track[len(track)-1] //get last recorded position

	if arePositionsIdentical(oldPos, newPos) {
		return false
	} //identical positions

	delta := newPos.Time.Sub(oldPos.Time)
	if delta.Minutes() < 1 {
		return false
	} //less than 1 minute difference
	return true
}

func persistLatestPosition(c *rejonson.Client, redisDataKey string, rawPos string) (bool, error) {
	var newPos pkg.Position
	err := json.Unmarshal([]byte(rawPos), &newPos) //get msg string, convert to byte array for unmarshal
	if err != nil {
		log.Fatal("unmarshal error", err)
	}

	JSONPath := fmt.Sprintf(".$%s", newPos.Icao)
	var oldPos pkg.Position

	currentPosRaw, err := c.JsonGet(redisDataKey, JSONPath).Bytes()
	if err != nil {
		return false, errors.New("Could not retrieve existing position:" + err.Error())
	}

	err = json.Unmarshal(currentPosRaw, &oldPos)
	if err != nil {
		return false, errors.New("Could not unmarshal existing position:" + err.Error())
	}

	if shouldSavePosition(oldPos, newPos) {
		_, err = c.JsonSet(redisDataKey, JSONPath, rawPos).Result()
		if err != nil {
			return false, errors.New("Could not save new position:" + err.Error())
		}
	}

	return true, nil
}

func persistLatestTrackPosition(c *rejonson.Client, rawPos string) (bool, error) {
	var newPos pkg.Position
	err := json.Unmarshal([]byte(rawPos), &newPos) //get msg string, convert to byte array for unmarshal
	if err != nil {
		log.Fatal("unmarshal error", err)
	}

	trackKey := fmt.Sprintf("track:$%s", newPos.Icao)
	_, err = pkg.EnsureJSONKeyExists(c, trackKey, "[]")
	if err != nil {
		return false, err
	}

	var track pkg.Positions
	rawTrack, err := c.JsonGet(trackKey).Bytes()
	if err != nil {
		return false, err
	}

	err = json.Unmarshal(rawTrack, &track)
	if err != nil {
		return false, err
	}

	if shouldSaveTrackPosition(track, newPos) { //compare last element of existing track to this new element
		_, err = c.JsonArrAppend(trackKey, ".", rawPos).Result()
		if err != nil {
			return false, err
		}
	}

	expireAt, err := time.ParseDuration("10m")
	_, err = c.Expire(trackKey, expireAt).Result()
	if err != nil {
		return false, err
	}

	return true, nil
}

//remove stale positions from our JSON map of current positions
func cleanStalePositions(c *rejonson.Client, redisDataKey string) (int, error) {
	deleteCount := 0
	currentData := pkg.GetPositionMap(c, redisDataKey)
	for k, pos := range currentData {
		age := time.Now().UTC().Sub(pos.Time)
		if age.Minutes() > 5 {
			_, err := c.JsonDel(redisDataKey, k).Result()
			if err != nil {
				return deleteCount, err
			}
			deleteCount++
		}
	}
	return deleteCount, nil
}

func Persist(c *rejonson.Client, redisSubChannel string, redisDataKey string) {
	pubsub := c.Subscribe(redisSubChannel)
	ch := pubsub.Channel()

	ticker := time.NewTicker(time.Second * 5)
	defer ticker.Stop()

	persistedPositionCount := 0
	droppedPositionCount := 0

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				break
			}

			wasPointPersisted, err := persistLatestPosition(c, redisDataKey, msg.Payload)
			if err != nil {
				log.Println("Encountered an error saving a position:", err)
			}

			_, err = persistLatestTrackPosition(c, msg.Payload)
			if err != nil {
				log.Println("Encountered an error saving a track:", err)
			}

			if wasPointPersisted {
				persistedPositionCount++
			} else {
				droppedPositionCount++
			}
		case <-ticker.C:
			log.Println(persistedPositionCount, "positions saved,", droppedPositionCount, "positions dropped in past 5 seconds")
			persistedPositionCount = 0
			droppedPositionCount = 0

			deleted, err := cleanStalePositions(c, redisDataKey)
			if err != nil {
				log.Fatal("Clean expired positions failed", err)
			}
			log.Println(deleted, "stale positions removed")

			//ensure the primary data key exists (if Redis loses data) without checking it on every Position set
			_, err = pkg.EnsureJSONKeyExists(c, redisDataKey, "{}")
			if err != nil {
				log.Fatal("Unable to ensure required key exists")
			}
		}
	}
}
