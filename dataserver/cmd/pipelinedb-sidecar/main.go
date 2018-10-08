package main

import (
	"encoding/json"
	"fmt"
	"github.com/KromDaniel/rejonson"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/gorilla/mux"
	"io/ioutil"
	"log"
	"net/http"
	"os"
)

type StreamPosition struct {
	Icao     string  `json:"icao"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lon"`
	Time     int64   `json:"time" db:"ptime3"`
}

func publishData(w http.ResponseWriter, r *http.Request, redisConn *rejonson.Client, dataKey string) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading body: %v", err)
		http.Error(w, "can't read body", http.StatusBadRequest)
		return
	}

	var jsonContent StreamPosition
	err = json.Unmarshal(body, &jsonContent)
	if err != nil {
		log.Printf("Error unmarshaling JSON: %v", err)
		http.Error(w, "can't unmarshal JSON", http.StatusBadRequest)
		return
	}

	_, err = redisConn.RPush(dataKey, body).Result()
	if err != nil {
		log.Printf("Error pushing to Redis: %v", err)
		http.Error(w, "can't push to Redis", http.StatusInternalServerError)
		return
	}
}

func main() {

	for _, pair := range os.Environ() {
		fmt.Println(pair)
	}

	redisAddress := os.Getenv("REDIS_ADDRESS")
	redisPort := os.Getenv("REDIS_PORT")
	redisDataKey := os.Getenv("REDIS_DATA_KEY")
	listenPort := os.Getenv("LISTEN_PORT")

	for _,v := range([]string{redisDataKey, redisAddress, redisPort, listenPort}) {
		if v == "" {
			panic(fmt.Sprintf("%s env variable not provided", v))
		}
	}

	reJsonClient := pkg.ProvideReJSONClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))

	router := mux.NewRouter()

	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		publishData(w, r, reJsonClient, redisDataKey)
	}).Methods("POST")

	log.Fatal(http.ListenAndServe(":" + listenPort, router))
}
