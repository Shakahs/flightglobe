package pkg

import (
	"encoding/json"
	"github.com/patrickmn/go-cache"
)

func SaveToCache(c *cache.Cache, rawPos string) error {
	var newPos Position
	err := json.Unmarshal([]byte(rawPos), &newPos)
	if err != nil {
		return err
	}

	c.Set(newPos.Icao, rawPos, 0)

	return nil
}
