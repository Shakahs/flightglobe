package lib

import (
	"encoding/json"
	"fmt"
	"os"
)

var redisdb = ProvideRedisClient()

var redisPubChannel = os.Getenv("REDIS_PUB_CHANNEL")

func publish(allpos Positions){
	published := 0
	for _, pos := range(allpos){
		marshaled, err := json.Marshal(pos)
		if err == nil {
			err = redisdb.Publish(redisPubChannel,  string(marshaled[:])).Err()
			if err != nil {
				panic(err)
			}
		}
		published++
	}
	fmt.Println("published", published, "positions")
}

func Persist(inChan chan Positions) {
	for {
		select {
		case r := <-inChan:
			publish(r)
		}
	}
}
