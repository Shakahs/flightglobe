package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/gorilla/websocket"
	"github.com/pkg/errors"
	"log"
	"net/http"
	"os"
	"time"
)

var upgrader = websocket.Upgrader{} // use default options
var connRedis = pkg.ProvideReJSONClient()
var redisDataKey = os.Getenv("REDIS_DATA_KEY")

func sendFull(c *websocket.Conn) error {
	data := pkg.GetPositionMapRaw(connRedis, redisDataKey)
	err := c.WriteMessage(1, data)
	if err != nil {
		return errors.New("sendFull failed")
	}
	return nil
}

func maintainConnection(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()
	fmt.Println("connection opened")

	ticker := time.NewTicker(time.Second * 5)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			err = sendFull(c)
			if err != nil {
				log.Println("write:", err, "closing connection")
				return
			}
		}
	}
	fmt.Println("connection closing")
}

func main() {
	http.HandleFunc("/", maintainConnection)
	log.Fatal(http.ListenAndServe("localhost:8080", nil))
}
