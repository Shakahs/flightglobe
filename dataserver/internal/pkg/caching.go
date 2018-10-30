package pkg

import (
	"github.com/go-redis/redis"
	"log"
	"time"
)

func CreateCache() *LockableSinglePositionDataset {
	return &LockableSinglePositionDataset{
		data: make(SinglePositionDataset),
	}
}

func CachePositions(r *redis.Client, channel string, c *LockableSinglePositionDataset) {
	pubsub := r.Subscribe(channel)
	ch := pubsub.Channel()

	discardTicker := time.NewTicker(time.Minute)
	defer discardTicker.Stop()

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
		case <-discardTicker.C:
			c.CleanPositions()
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

func (c *LockableSinglePositionDataset) CleanPositions() {
	c.lock.Lock()
	delCount := 0
	for k, v := range c.data {
		elapsed := time.Now().UTC().Sub(v.Time)
		if elapsed > time.Minute*5 {
			delete(c.data, k)
			delCount++
		}
	}
	c.lock.Unlock()
	log.Printf("%d Positions expired from Cache", delCount)
}
