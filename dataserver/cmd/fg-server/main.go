package main

import (
	"encoding/json"
	"fmt"
	"github.com/NYTimes/gziphandler"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/go-redis/redis"
	"github.com/gorilla/websocket"
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

func sendIncrementalPositions(c *websocket.Conn, t time.Time) error {
	data := positionCache.GetPositions()

	fmt.Printf("Received request for all data after %s\n", t.String())
	sentCount := 0

	for _, v := range data {
		if v.Time.After(t) {
			var positionUpdate = pkg.PositionUpdate{
				Type: "positionUpdate",
				Icao: v.Icao,
				Body: &v.Position,
			}
			marshaled, err := json.Marshal(positionUpdate)
			if err != nil {
				return errors.New("sendIncrementalPositions JSON marshal position failed")
			}

			err = c.WriteMessage(1, marshaled)
			if err != nil {
				return errors.New("sendIncrementalPositions position failed")
			}

			var demographicUpdate = pkg.DemographicUpdate{"demographicUpdate", v.Icao, &v.Demographic}
			marshaled, err = json.Marshal(demographicUpdate)
			if err != nil {
				return errors.New("sendIncrementalPositions JSON marshal demographic failed")
			}

			err = c.WriteMessage(1, marshaled)
			if err != nil {
				return errors.New("sendIncrementalPositions demographic failed")
			}

			sentCount++
		}
	}

	fmt.Printf("sent %d FlightRecords\n", sentCount)
	return nil
}

//func readLoop(c *websocket.Conn) {
//	for {
//		if _, _, err := c.NextReader(); err != nil {
//			c.Close()
//			break
//		}
//	}
//}

func maintainConnection(w http.ResponseWriter, r *http.Request) {
	wsConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}

	defer wsConn.Close()
	//go readLoop(wsConn)

	fmt.Println("connection opened")
	sendIncrementalPositions(wsConn, time.Now().UTC().Add(time.Hour*time.Duration(-1)))

	time.Sleep(2 * time.Second)

	for {
		_, message, err := wsConn.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}

		var request pkg.PositionRequest
		err = json.Unmarshal(message, &request)
		if err != nil {
			log.Println("read:", err)
			break
		}

		sendIncrementalPositions(wsConn, time.Unix(request.LastReceivedTimestamp, 0).UTC())
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
var deploymentEnvironment string
var isDeployedProduction bool
var upgrader = websocket.Upgrader{}
var positionCache *pkg.LockableRecordMap
var redisClient *redis.Client

func init() {
	redisAddress = os.Getenv("REDIS_ADDRESS")
	redisPort = os.Getenv("REDIS_PORT")
	redisSubChannel = os.Getenv("REDIS_SUB_CHANNEL")
	deploymentEnvironment = os.Getenv("DEPLOYMENT_ENVIRONMENT")

	pkg.CheckEnvVars(redisAddress, redisPort, redisSubChannel)

	if deploymentEnvironment == "" || deploymentEnvironment == "production" {
		isDeployedProduction = true
	} else {
		isDeployedProduction = false
	}
	fmt.Printf("Production environment: %t\n", isDeployedProduction)

	redisClient = pkg.ProvideRedisClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))

	positionCache = pkg.CreateCache()
}

func main() {
	go pkg.CachePositions(redisClient, redisSubChannel, positionCache)
	var fs http.Handler
	if isDeployedProduction {
		fs = http.FileServer(http.Dir("/var/flightglobe/static"))
	} else {
		fs = http.FileServer(http.Dir("static"))
	}
	http.Handle("/", gziphandler.GzipHandler(fs))
	http.HandleFunc("/sub", maintainConnection)
	//http.HandleFunc("/track", provideTrack)
	log.Fatal(http.ListenAndServe(":8081", nil))
}
