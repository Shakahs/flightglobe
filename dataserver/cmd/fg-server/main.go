package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/go-redis/redis"
	"github.com/gorilla/websocket"
	"github.com/patrickmn/go-cache"
	"github.com/pkg/errors"
	"log"
	"net/http"
	"os"
	"time"
)

//use this upgrader if frontend app and backend server will be on different domains,
// otherwise the browser will be unable to connect via Websocket due to security policy
//var upgrader =  websocket.Upgrader{
//	CheckOrigin: func(r *http.Request) bool {
//		return true
//	},
//}

func sendFull(c *websocket.Conn) error {
	data, err := pkg.RetrievePositionsFromCache(positionCache)
	if err != nil {
		return err
	}

	for _, v := range data {
		marshaled, err := pkg.MarshalPosition(v)
		if err != nil {
			return errors.New("sendFull failed")
		}

		err = c.WriteMessage(1, marshaled)
		if err != nil {
			return errors.New("sendFull failed")
		}
	}

	fmt.Println("sendFull completed")
	return nil
}

func readLoop(c *websocket.Conn) {
	for {
		if _, _, err := c.NextReader(); err != nil {
			c.Close()
			break
		}
	}
}

func maintainConnection(w http.ResponseWriter, r *http.Request) {
	wsConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}

	defer wsConn.Close()
	go readLoop(wsConn)

	fmt.Println("connection opened")

	ticker := time.NewTicker(time.Second * 5)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			err = sendFull(wsConn)
			if err != nil {
				log.Println("write:", err, "closing connection")
				return
			}
		}
	}
	fmt.Println("connection closing")
}

//func provideTrack(w http.ResponseWriter, r *http.Request) {
//	icao := r.URL.Query().Get("icao")
//	trackKey := fmt.Sprintf("track:%s", icao)
//	trackRaw, err := redisClient.JsonGet(trackKey).Bytes()
//	if err != nil {
//		w.WriteHeader(http.StatusBadRequest)
//		w.Write([]byte("Could not retrieve track: " + trackKey))
//		log.Println("Failed request for track", trackKey)
//	} else {
//		w.Write(trackRaw)
//		log.Println("Sent track:", trackKey)
//	}
//}

var redisSubChannel string
var redisAddress string
var redisPort string
var upgrader = websocket.Upgrader{}
var positionCache *cache.Cache
var redisClient *redis.Client

func init() {
	redisAddress = os.Getenv("REDIS_ADDRESS")
	redisPort = os.Getenv("REDIS_PORT")
	redisSubChannel = os.Getenv("REDIS_SUB_CHANNEL")

	pkg.CheckEnvVars(redisAddress, redisPort, redisSubChannel)

	redisClient = pkg.ProvideRedisClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))

	positionCache = pkg.CreatePositionCache()
}

func main() {
	go pkg.CachePositions(redisClient, redisSubChannel, positionCache)
	fs := http.FileServer(http.Dir("/var/flightglobe/static"))
	http.Handle("/", fs)
	http.HandleFunc("/sub", maintainConnection)
	//http.HandleFunc("/track", provideTrack)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
