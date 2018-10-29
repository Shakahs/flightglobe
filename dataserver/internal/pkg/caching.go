package pkg

import (
	"encoding/json"
	"github.com/go-redis/redis"
	"github.com/patrickmn/go-cache"
	"time"
)

func CreatePositionCache() *cache.Cache {
	return cache.New(5*time.Minute, 1*time.Minute)
}

func CachePositions(r *redis.Client, channel string, c *cache.Cache) {
	pubsub := r.Subscribe(channel)
	ch := pubsub.Channel()

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				break
			}
			payload := msg.Payload
			SavePositionToCache(c, &payload)
		}
	}
}

func SavePositionToCache(c *cache.Cache, rawPos *string) error {
	var newPos Position
	err := json.Unmarshal([]byte(*rawPos), &newPos)
	if err != nil {
		return err
	}

	c.SetDefault(newPos.Icao, rawPos)

	return nil
}

func RetrievePositionsFromCache(c *cache.Cache) (SinglePositionDataset, error) {
	data := make(SinglePositionDataset)
	items := c.Items()
	for k, v := range items {
		var pos Position
		err := json.Unmarshal([]byte(*v.Object.(*string)), &pos)
		if err != nil {
			return data, err
		}
		data[k] = &pos
	}
	return data, nil
}
