package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/app/redis-point-persistor"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/go-redis/redis"
	"os"
	"os/signal"
	"syscall"
)

var redisSubChannel string
var redisPubChannel string
var redisAddress string
var redisPort string
var redisClient *redis.Client

func init() {
	redisSubChannel = os.Getenv("REDIS_SUB_CHANNEL")
	redisPubChannel = os.Getenv("REDIS_PUB_CHANNEL")
	redisAddress = os.Getenv("REDIS_ADDRESS")
	redisPort = os.Getenv("REDIS_PORT")

	pkg.CheckEnvVars(redisSubChannel, redisPubChannel, redisAddress, redisPort)

	redisClient = pkg.ProvideRedisClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))
}

func main() {
	go redis_point_persistor.Persist(redisClient, redisSubChannel, redisPubChannel)

	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc,
		syscall.SIGHUP,
		syscall.SIGINT,
		syscall.SIGTERM,
		syscall.SIGQUIT)

	for {
		select {
		case <-sigc:
			fmt.Println("Received signal, quitting")
			return
		}
	}
}
