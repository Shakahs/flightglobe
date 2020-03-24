package pkg

import (
	"encoding/json"
	"fmt"
	"github.com/go-redis/redis"
	_ "github.com/jackc/pgx/stdlib"
	"github.com/paulbellamy/ratecounter"
	log2 "github.com/prometheus/common/log"
	"log"
	"time"
)

func ProvideRedisClient(redisAddress string, redisPort string) *redis.Client {
	redisAddress = fmt.Sprintf("%s:%s",
		redisAddress, redisPort)
	goRedisClient := redis.NewClient(&redis.Options{
		Addr: redisAddress,
	})
	return goRedisClient
}

func PublishPosition(c *redis.Client, pubChannel string, newPos *FlightRecord) error {
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

func publishPositions(c *redis.Client, pubChannel string, newData FlightRecords) (int64, error) {
	publishCount := int64(0)
	for _, newPos := range newData {
		err := PublishPosition(c, pubChannel, &newPos)
		if err != nil {
			return publishCount, err
		}
		publishCount++
	}
	return publishCount, nil
}

func PublishPositionsFromChan(inChan chan FlightRecords, c *redis.Client, pubChannel string) {
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
			log.Printf("published %d positions in the past 5 seconds\n", counter.Rate())
		}
	}
}

func GeneratePointKeyName(icao string) string {
	return fmt.Sprintf("position:%s", icao)
}

func GenerateTrackKeyName(icao string) string {
	return fmt.Sprintf("track:%s", icao)
}

func WaitRedisConnected(r *redis.Client) {
	//wait here until Redis connects
	redisConnected := false
	for redisConnected == false {
		_, err := r.Ping().Result()
		if err == nil {
			redisConnected = true
			log2.Info("Connected to Redis")
		} else {
			log2.Info("Waiting to connect to Redis...")
			time.Sleep(time.Second * 5)
		}
	}
}
