package pkg

import (
	"encoding/json"
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