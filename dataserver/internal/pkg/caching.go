package pkg

import (
	"encoding/json"
	"github.com/patrickmn/go-cache"
	"time"
)

func ProvideCache() *cache.Cache {
	return cache.New(5*time.Minute, 6*time.Minute)
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
