package lib

import (
	"github.com/KromDaniel/rejonson"
	"github.com/go-redis/redis"
	_ "github.com/jackc/pgx/stdlib"
	"os"
)



func ProvideRedisClient() *redis.Client {
	goRedisClient := redis.NewClient(&redis.Options{
		Addr: os.Getenv("REDIS_URL"),
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
