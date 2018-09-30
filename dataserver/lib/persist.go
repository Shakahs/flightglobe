package lib

import (
	"encoding/json"
	"fmt"
	"github.com/go-redis/redis"
	"os"
)




var redisdb = redis.NewClient(&redis.Options{
	Addr: os.Getenv("REDIS_URL"),
})

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
