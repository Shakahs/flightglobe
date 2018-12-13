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

func isPositionValid(newPos *pkg.FlightRecord) bool {
	if newPos.Icao == "" {
		return false
	} //blank ICAO

	return true
}

func arePositionsIdentical(oldRecord *pkg.FlightRecord, newRecord *pkg.FlightRecord) bool {
	if oldRecord.Position.Latitude == newRecord.Position.Latitude &&
		oldRecord.Position.Longitude == newRecord.Position.Longitude {
		return true
	} //identical coordinates

	return false
}

func shouldSavePosition(oldPos *pkg.FlightRecord, newPos *pkg.FlightRecord) bool {
	if !isPositionValid(newPos) {
		return false
	} //failed validation

	if arePositionsIdentical(oldPos, newPos) {
		return false
	} //identical coordinates
	return true
}

//func shouldSaveTrackPosition(track pkg.FlightRecords, newPos pkg.FlightRecord) bool {
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

func generateTrackKeyName(icao string) string {
	return fmt.Sprintf("track:%s", icao)
}

func decodeRedisResponse(oldPosRaw []byte, err error) (*pkg.FlightRecord, error) {
	var oldPos pkg.FlightRecord
	if err == redis.Nil {
		return &oldPos, err
	} else if err != nil {
		return &oldPos, errors.New("Could not retrieve position:" + err.Error())
	}

	err = json.Unmarshal(oldPosRaw, &oldPos)
	if err != nil {
		return &oldPos, errors.New("Could not unmarshal position:" + err.Error())
	}

	return &oldPos, nil
}

func getLatestPosition(c *redis.Client, icao string) (*pkg.FlightRecord, error) {
	oldPosRaw, err := c.Get(generatePointKeyName(icao)).Bytes()
	return decodeRedisResponse(oldPosRaw, err)
}

func getLatestTrackPosition(c *redis.Client, icao string) (*pkg.FlightRecord, error) {
	oldPosRaw, err := c.LIndex(generateTrackKeyName(icao), -1).Bytes()
	return decodeRedisResponse(oldPosRaw, err)
}

func persistLatestPosition(c *redis.Client, newPos *pkg.FlightRecord, rawPos *string) (bool, error) {

	oldPos, err := getLatestPosition(c, newPos.Icao)
	if err != redis.Nil && err != nil {
		return false, errors.New("Could not retrieve old position:" + err.Error())
	}

	if err == redis.Nil || shouldSavePosition(oldPos, newPos) { //either it does not exist, or we need to overwrite
		_, err = c.Set(generatePointKeyName(newPos.Icao), *rawPos, time.Minute*10).Result()
		if err != nil {
			return false, errors.New("Could not save new position:" + err.Error())
		}
	}

	return true, nil
}

func persistLatestTrackPosition(c *redis.Client, newPos *pkg.FlightRecord, rawPos *string) (bool, error) {
	oldPos, err := getLatestTrackPosition(c, newPos.Icao)
	if err != redis.Nil && err != nil {
		return false, errors.New("Could not retrieve old track position:" + err.Error())
	}

	if err == redis.Nil || shouldSavePosition(oldPos, newPos) { //either it does not exist, or we need to overwrite
		_, err = c.RPush(generateTrackKeyName(newPos.Icao), *rawPos).Result()
		if err != nil {
			return false, errors.New("Could not save new track position:" + err.Error())
		}
		boolSet, err := c.Expire(generateTrackKeyName(newPos.Icao), time.Minute*10).Result()
		if boolSet == false || err != nil {
			return false, errors.New("Could not set expire for new track position:" + err.Error())
		}
	}

	return true, nil
}

//func persistLatestTrackPosition(c *rejonson.Client, rawPos string) (bool, error) {
//	var newPos pkg.FlightRecord
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
//	var track pkg.FlightRecords
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

	pointPersistCounter := ratecounter.NewRateCounter(5 * time.Second)
	trackPersistCounter := ratecounter.NewRateCounter(5 * time.Second)
	pointPublishCounter := ratecounter.NewRateCounter(5 * time.Second)
	pointDropCounter := ratecounter.NewRateCounter(5 * time.Second)
	trackDropCounter := ratecounter.NewRateCounter(5 * time.Second)

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				break
			}

			newPos, err := pkg.UnmarshalPosition(msg.Payload)
			if err != nil {
				log.Println("Unable to unmarshal FlightRecord from pubsub feed")
				break
			}

			_, err = persistLatestPosition(c, newPos, &msg.Payload)
			if err != nil {
				pointDropCounter.Incr(1)
				log.Println("Encountered an error saving a position:", err)
			} else {
				pointPersistCounter.Incr(1)
				err := pkg.PublishPosition(c, redisPubChannel, newPos)
				if err != nil {
					log.Println("Encountered an error publishing a position:", err)
				} else {
					pointPublishCounter.Incr(1)
				}
			}

			_, err = persistLatestTrackPosition(c, newPos, &msg.Payload)
			if err != nil {
				trackDropCounter.Incr(1)
				log.Println("Encountered an error saving a track:", err)
			} else {
				trackPersistCounter.Incr(1)
			}

		case <-ticker.C:
			log.Printf("in the past 5 seconds: %d positions persisted, %d positions published, %d positions dropped, %d track persisted, %d tracks dropped ",
				pointPersistCounter.Rate(), pointPublishCounter.Rate(), pointDropCounter.Rate(), trackPersistCounter.Rate(), trackDropCounter.Rate())
		}
	}
}
