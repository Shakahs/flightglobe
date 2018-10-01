package pkg

import (
	"encoding/json"
	"github.com/KromDaniel/rejonson"
	"github.com/go-redis/redis"
	_ "github.com/jackc/pgx/stdlib"
	"os"
)



func ProvideRedisClient() *redis.Client {
	redisAddress := os.Getenv("REDIS_URL")
	if redisAddress == "" {
		panic("REDIS_URL env variable missing")
	}
	goRedisClient := redis.NewClient(&redis.Options{
		Addr: redisAddress,
	})
	return goRedisClient
}

func RedisReJSONExtender(c *redis.Client) *rejonson.Client {
	rJsonClient := rejonson.ExtendClient(c)
	return rJsonClient
}

func ProvideReJSONClient() *rejonson.Client {
	originalClient := ProvideRedisClient()
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

