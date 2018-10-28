package pkg

import (
	"encoding/json"
	"fmt"
	"github.com/KromDaniel/rejonson"
	"github.com/go-redis/redis"
	_ "github.com/jackc/pgx/stdlib"
)



func ProvideRedisClient(redisAddress string) *redis.Client {
	goRedisClient := redis.NewClient(&redis.Options{
		Addr: redisAddress,
	})
	return goRedisClient
}

func RedisReJSONExtender(c *redis.Client) *rejonson.Client {
	rJsonClient := rejonson.ExtendClient(c)
	return rJsonClient
}

func ProvideReJSONClient(redisAddress string) *rejonson.Client {
	originalClient := ProvideRedisClient(redisAddress)
	extendedClient := RedisReJSONExtender(originalClient)
	return extendedClient
}


//var DB = sqlx.MustConnect("pgx",
//	"postgres://flightglobe:flightglobe@localhost/flightglobe")

func GetPositionMapRaw(c *rejonson.Client, dataKey string) []byte {
	rawData, err := c.JsonGet(dataKey).Bytes()
	if err != nil {
		panic(err)
	}
	return rawData
}

func GetPositionMap(c *rejonson.Client, dataKey string) SinglePositionDataset {
	rawData := GetPositionMapRaw(c, dataKey)

	var pMap SinglePositionDataset
	err := json.Unmarshal(rawData, &pMap)
	if err != nil {
		panic(err)
	}

	return pMap
}

func EnsureJSONKeyExists(c *rejonson.Client, redisDataKey string, data string) (bool, error) {
	if c.Exists(redisDataKey).Val() == 0 {
		_, err := c.JsonSet(redisDataKey, ".", data).Result()
		if err != nil {
			return false, err
		}
	}

	return true, nil
}

func publishPosition(allpos Positions, c *rejonson.Client, redisPubChannel string){
	published := 0
	for _, pos := range(allpos){
		marshaled, err := json.Marshal(pos)
		if err == nil {
			err = c.Publish(redisPubChannel,  string(marshaled[:])).Err()
			if err != nil {
				panic(err)
			}
		}
		published++
	}
	fmt.Println("published", published, "positions downstream")
}

func PublishPositions(inChan chan Positions, c *rejonson.Client, pubChannel string) {
	for {
		select {
		case r := <-inChan:
			publishPosition(r, c, pubChannel)
		}
	}
}