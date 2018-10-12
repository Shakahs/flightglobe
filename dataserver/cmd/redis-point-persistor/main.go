package main

import (
	"fmt"
	"github.com/KromDaniel/rejonson"
	"github.com/Shakahs/flightglobe/dataserver/internal/app/redis-point-persistor"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"log"
	"os"
	"os/signal"
	"syscall"
)

var redisSubChannel string
var redisDataKey string
var redisAddress string
var redisPort string
var reJsonClient *rejonson.Client

func init() {
	redisSubChannel = os.Getenv("REDIS_SUB_CHANNEL")
	redisDataKey = os.Getenv("REDIS_DATA_KEY")
	redisAddress = os.Getenv("REDIS_ADDRESS")
	redisPort = os.Getenv("REDIS_PORT")

	for _, v := range []string{redisSubChannel, redisDataKey, redisAddress, redisPort} {
		if v == "" {
			log.Fatal("Required env variable missing")
		}
	}

	reJsonClient = pkg.ProvideReJSONClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))

	_, err := pkg.EnsureJSONKeyExists(reJsonClient, redisDataKey, "{}")
	if err != nil {
		log.Fatal("Unable to ensure required key exists")
	}
}

func main() {
	go redis_point_persistor.Persist(reJsonClient, redisSubChannel, redisDataKey)

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
