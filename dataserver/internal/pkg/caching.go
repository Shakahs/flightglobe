package pkg

import (
	"github.com/go-redis/redis"
	"log"
	"time"
)

func CreateCache() *LockableRecordMap {
	return &LockableRecordMap{
		data: make(RecordMap),
	}
}

func CachePositions(r *redis.Client, channel string, c *LockableRecordMap) {
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

func (c *LockableRecordMap) SavePosition(newPos *FlightRecord) {
	c.lock.Lock()
	c.data[newPos.Icao] = newPos
	c.lock.Unlock()
}

func (c *LockableRecordMap) GetPositions() []*FlightRecord {
	var dataset []*FlightRecord
	c.lock.RLock()
	for _, v := range c.data {
		dataset = append(dataset, v)
	}
	c.lock.RUnlock()
	return dataset
}

func (c *LockableRecordMap) CleanPositions() {
	c.lock.Lock()
	delCount := 0
	totalCount := 0
	for k, v := range c.data {
		elapsed := time.Now().UTC().Sub(v.Time)
		if elapsed > time.Minute*5 {
			delete(c.data, k)
			delCount++
		} else {
			totalCount++
		}
	}
	c.lock.Unlock()
	log.Printf("%d FlightRecords expired from Cache, there are now %d cached records", delCount, totalCount)
}
