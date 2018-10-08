package main

import (
	"fmt"
	"github.com/KromDaniel/rejonson"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/gorilla/websocket"
	"github.com/pkg/errors"
	"log"
	"net/http"
	"os"
	"time"
)

var upgrader = websocket.Upgrader{} // use default options

func sendFull(c *websocket.Conn, r *rejonson.Client, redisDataKey string) error {
	data := pkg.GetPositionMapRaw(r, redisDataKey)
	err := c.WriteMessage(1, data)
	if err != nil {
		return errors.New("sendFull failed")
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
	redisDataKey := os.Getenv("REDIS_DATA_KEY")
	redisAddress := os.Getenv("REDIS_ADDRESS")
	redisPort := os.Getenv("REDIS_PORT")
	var redisConn = pkg.ProvideReJSONClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))

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
			err = sendFull(wsConn, redisConn, redisDataKey)
			if err != nil {
				log.Println("write:", err, "closing connection")
				return
			}
		}
	}
	fmt.Println("connection closing")
}

func main() {
	redisDataKey := os.Getenv("REDIS_DATA_KEY")
	redisAddress := os.Getenv("REDIS_ADDRESS")
	redisPort := os.Getenv("REDIS_PORT")

	for _,v := range([]string{redisDataKey, redisAddress, redisPort}) {
		if v == "" {
			panic(fmt.Sprintf("%s env variable not provided", v))
		}
	}

	fs := http.FileServer(http.Dir("/var/flightglobe/static"))
	http.Handle("/", fs)
	http.HandleFunc("/sub", maintainConnection)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
