package pkg

import (
	"encoding/json"
	"fmt"
	"github.com/KromDaniel/rejonson"
	"github.com/go-redis/redis"
	_ "github.com/jackc/pgx/stdlib"
	"github.com/paulbellamy/ratecounter"
	"log"
	"time"
)

func ProvideRedisClient(redisAddress string) *redis.Client {
	goRedisClient := redis.NewClient(&redis.Options{
		Addr: redisAddress,
	})
	return goRedisClient
}

func RedisReJSONExtender(c *redis.Client) *rejonson.Client {
	rJsonClient := rejonson.ExtendClient(c)
	return rJsonClient
}

func ProvideReJSONClient(redisAddress string) *rejonson.Client {
	originalClient := ProvideRedisClient(redisAddress)
	extendedClient := RedisReJSONExtender(originalClient)
	return extendedClient
}

//var DB = sqlx.MustConnect("pgx",
//	"postgres://flightglobe:flightglobe@localhost/flightglobe")

func GetPositionMapRaw(c *rejonson.Client, dataKey string) []byte {
	rawData, err := c.JsonGet(dataKey).Bytes()
	if err != nil {
		panic(err)
	}
	return rawData
}

func GetPositionMap(c *rejonson.Client, dataKey string) SinglePositionDataset {
	rawData := GetPositionMapRaw(c, dataKey)

	var pMap SinglePositionDataset
	err := json.Unmarshal(rawData, &pMap)
	if err != nil {
		panic(err)
	}

	return pMap
}

func EnsureJSONKeyExists(c *rejonson.Client, redisDataKey string, data string) (bool, error) {
	if c.Exists(redisDataKey).Val() == 0 {
		_, err := c.JsonSet(redisDataKey, ".", data).Result()
		if err != nil {
			return false, err
		}
	}

	return true, nil
}

func publishPosition(c *redis.Client, pubChannel string, newPos Position) error {
	marshaled, err := json.Marshal(newPos)
	if err != nil {
		return err
	}

	err = c.Publish(pubChannel, string(marshaled[:])).Err()
	if err != nil {
		return err
	}

	return nil
}

func publishPositions(c *redis.Client, pubChannel string, newData Positions) (int64, error) {
	publishCount := int64(0)
	for _, newPos := range newData {
		err := publishPosition(c, pubChannel, newPos)
		if err != nil {
			return publishCount, err
		}
		publishCount++
	}
	return publishCount, nil
}

func PublishPositionsFromChan(inChan chan Positions, c *redis.Client, pubChannel string) {
	counter := ratecounter.NewRateCounter(5 * time.Second)

	for {
		select {
		case newData := <-inChan:
			publishCount, err := publishPositions(c, pubChannel, newData)
			if err != nil {
				log.Fatal(err)
			}

			counter.Incr(publishCount)

			fmt.Printf("publishing %d 5 seconds\n", counter.Rate())
		}
	}
}
