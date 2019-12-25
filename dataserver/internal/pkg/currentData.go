package pkg

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-redis/redis"
	"os"
)

func scanKeys(redisClient *redis.Client) []string {
	var cursor uint64
	var err error
	var keys []string

	for {
		var newKeys []string
		if newKeys, cursor, err = redisClient.Scan(cursor, "track:*", 100).Result(); err != nil {
			fmt.Println("ERROR: %s", err)
			os.Exit(2)
		}

		for _, k := range newKeys {
			keys = append(keys, k)
		}

		if cursor == 0 {
			break
		}
	}

	return keys
}

func GetFullTrack(redisClient *redis.Client, key string) (FlightRecords, error) {
	var result FlightRecords
	rawList, err := redisClient.LRange(key, 0, -1).Result()
	if err != nil {
		return nil, err
	}

	for _, v := range rawList {
		var pos FlightRecord
		err := json.Unmarshal([]byte(v), &pos)
		if err == nil {
			result = append(result, pos)
		}
	}

	if len(result) == 0 {
		return nil, errors.New("no positions found for this track key")
	}

	return result, nil
}

func GetCurrentData(redisClient *redis.Client) (DemographicsMap, GeohashSet, GeocollectedPositions) {
	var demographicsMap = make(DemographicsMap)
	var geohashSet = make(GeohashSet)
	var geoCollectedPositions = make(GeocollectedPositions)

	//get all keys
	keys := scanKeys(redisClient)
	for _, k := range keys {
		allPos, err := GetFullTrack(redisClient, k)
		if err == nil {
			var last = allPos[len(allPos)-1]
			var geohashShort = string(last.Position.Geohash[0])
			demographicsMap[last.Icao] = last.Demographic
			geohashSet[geohashShort] = true
			var thisGeo, exists = geoCollectedPositions[geohashShort]
			if !exists {
				thisGeo = GeohashedPositions{
					Geohash: geohashShort,
					Flights: make(map[string]Position),
				}
				geoCollectedPositions[geohashShort] = thisGeo
			}
			thisGeo.Geohash = geohashShort
			thisGeo.Flights[last.Icao] = last.Position
		}
	}

	return demographicsMap, geohashSet, geoCollectedPositions
}
