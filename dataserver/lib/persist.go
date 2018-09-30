package lib

import (
	"encoding/json"
	"fmt"
	"github.com/go-redis/redis"
	"os"
)

//var persistQuery = `INSERT INTO positions(lat, lng, heading, altitude,icao)
//          VALUES(:lat, :lng, :heading, :altitude, :icao)`

//func insert(newData Positions) {
//	start := time.Now()
//	tx := DB.MustBegin()
//
//	for _, position := range newData {
//		_, err := tx.NamedExec(persistQuery, position)
//		if err != nil {
//			fmt.Println(err)
//		}
//	}
//	fmt.Println("Inserted", len(newData), "positions")
//
//	err := tx.Commit()
//	if err != nil {
//		fmt.Println(err)
//	}
//
//	elapsed := time.Since(start)
//	fmt.Println("Insert took", elapsed)
//}

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
