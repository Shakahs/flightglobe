package pkg

import (
	"encoding/json"
	"fmt"
	"github.com/go-redis/redis"
	_ "github.com/jackc/pgx/stdlib"
	"github.com/patrickmn/go-cache"
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

	ticker := time.NewTicker(time.Second * 5)
	defer ticker.Stop()

	for {
		select {
		case newData := <-inChan:
			publishCount, err := publishPositions(c, pubChannel, newData)
			if err != nil {
				log.Fatal(err)
			}

			counter.Incr(publishCount)

		case <-ticker.C:
			fmt.Printf("published %d positions in the past 5 seconds\n", counter.Rate())
		}
	}
}

func SavePositionToCache(c *cache.Cache, rawPos string) error {
	var newPos Position
	err := json.Unmarshal([]byte(rawPos), &newPos)
	if err != nil {
		return err
	}

	c.Set(newPos.Icao, rawPos, 0)

	return nil
}

func RetrievePositionsFromCache(c *cache.Cache) (SinglePositionDataset, error) {
	data := make(SinglePositionDataset)
	items := c.Items()
	for k, v := range items {
		var pos Position
		err := json.Unmarshal([]byte(v.Object.(string)), &pos)
		if err != nil {
			return data, err
		}
		data[k] = pos
	}
	return data, nil
}
