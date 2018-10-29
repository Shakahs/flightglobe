package redis_point_persistor

import (
	"encoding/json"
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/go-redis/redis"
	"github.com/paulbellamy/ratecounter"
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

//func shouldSaveTrackPosition(track pkg.Positions, newPos pkg.Position) bool {
//	if !isPositionValid(newPos) {
//		return false
//	} //failed validation
//
//	if len(track) == 0 {
//		return true
//	} //empty track
//
//	oldPos := track[len(track)-1] //get last recorded position
//
//	if arePositionsIdentical(oldPos, newPos) {
//		return false
//	} //identical positions
//
//	delta := newPos.Time.Sub(oldPos.Time)
//	if delta.Minutes() < 1 {
//		return false
//	} //less than 1 minute difference
//	return true
//}

func generatePointKeyName(icao string) string {
	return fmt.Sprintf("position:%s", icao)
}

func getLatestPosition(c *redis.Client, icao string) (pkg.Position, error) {
	var oldPos pkg.Position

	oldPosRaw, err := c.Get(generatePointKeyName(icao)).Bytes()
	if err == redis.Nil {
		return oldPos, err
	} else if err != nil {
		return oldPos, errors.New("Could not retrieve position:" + err.Error())
	}

	err = json.Unmarshal(oldPosRaw, &oldPos)
	if err != nil {
		return oldPos, errors.New("Could not unmarshal position:" + err.Error())
	}

	return oldPos, nil
}

func persistLatestPosition(c *redis.Client, rawPos string) (bool, error) {
	newPos, err := pkg.UnmarshalPosition(rawPos)
	if err != nil {
		return false, err
	}

	oldPos, err := getLatestPosition(c, newPos.Icao)
	if err != redis.Nil && err != nil {
		return false, errors.New("Could not retrieve old position:" + err.Error())
	}

	if shouldSavePosition(oldPos, newPos) {
		_, err = c.Set(generatePointKeyName(newPos.Icao), rawPos, time.Minute*10).Result()
		if err != nil {
			return false, errors.New("Could not save new position:" + err.Error())
		}
	}

	return true, nil
}

//func persistLatestTrackPosition(c *rejonson.Client, rawPos string) (bool, error) {
//	var newPos pkg.Position
//	err := json.Unmarshal([]byte(rawPos), &newPos) //get msg string, convert to byte array for unmarshal
//	if err != nil {
//		log.Fatal("unmarshal error", err)
//	}
//
//	trackKey := fmt.Sprintf("track:$%s", newPos.Icao)
//	_, err = pkg.EnsureJSONKeyExists(c, trackKey, "[]")
//	if err != nil {
//		return false, err
//	}
//
//	var track pkg.Positions
//	rawTrack, err := c.JsonGet(trackKey).Bytes()
//	if err != nil {
//		return false, err
//	}
//
//	err = json.Unmarshal(rawTrack, &track)
//	if err != nil {
//		return false, err
//	}
//
//	if shouldSaveTrackPosition(track, newPos) { //compare last element of existing track to this new element
//		_, err = c.JsonArrAppend(trackKey, ".", rawPos).Result()
//		if err != nil {
//			return false, err
//		}
//	}
//
//	expireAt, err := time.ParseDuration("10m")
//	_, err = c.Expire(trackKey, expireAt).Result()
//	if err != nil {
//		return false, err
//	}
//
//	return true, nil
//}

func Persist(c *redis.Client, redisSubChannel string, redisPubChannel string) {
	subscription := c.Subscribe(redisSubChannel)
	ch := subscription.Channel()

	ticker := time.NewTicker(time.Second * 5)
	defer ticker.Stop()

	persistCounter := ratecounter.NewRateCounter(5 * time.Second)
	dropCounter := ratecounter.NewRateCounter(5 * time.Second)

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				break
			}

			wasPointPersisted, err := persistLatestPosition(c, msg.Payload)
			if err != nil {
				log.Println("Encountered an error saving a position:", err)
			}

			//_, err = persistLatestTrackPosition(c, msg.Payload)
			//if err != nil {
			//	log.Println("Encountered an error saving a track:", err)
			//}

			if wasPointPersisted {
				persistCounter.Incr(1)
			} else {
				dropCounter.Incr(1)
			}
		case <-ticker.C:
			log.Printf("%d positions saved, %d positions dropped in the past 5 seconds",
				persistCounter.Rate(), dropCounter.Rate())
		}
	}
}
