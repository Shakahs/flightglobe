package pkg

import (
	"github.com/go-redis/redis"
	"log"
)

func CreateCache() *LockableSinglePositionDataset {
	return &LockableSinglePositionDataset{
		data: make(SinglePositionDataset),
	}
}

func CachePositions(r *redis.Client, channel string, c *LockableSinglePositionDataset) {
	pubsub := r.Subscribe(channel)
	ch := pubsub.Channel()

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				break
			}
			newPos, err := UnmarshalPosition(msg.Payload)
			if err != nil {
				log.Fatal("error unmarshaling position", err)
			}
			c.SavePosition(newPos)
		}
	}
}

func (c *LockableSinglePositionDataset) SavePosition(newPos *Position) {
	c.lock.Lock()
	c.data[newPos.Icao] = newPos
	c.lock.Unlock()
}

func (c *LockableSinglePositionDataset) GetPositions() []*Position {
	var dataset []*Position
	c.lock.RLock()
	for _, v := range c.data {
		dataset = append(dataset, v)
	}
	c.lock.RUnlock()
	return dataset
}
