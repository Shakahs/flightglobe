package main

import (
	"encoding/json"
	"fmt"
	"github.com/KromDaniel/rejonson"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/jmoiron/sqlx"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

var persistQuery = `INSERT INTO position_stream (lat, lng, heading, altitude, icao)
         VALUES(:lat, :lng, :heading, :altitude, :icao)`



//func insert(newData pkg.Position) {
//	tx := DB.MustBegin()
//
//	_, err := tx.NamedExec(persistQuery, newData)
//	if err != nil {
//		fmt.Println(err)
//	}
//
//	err = tx.Commit()
//	if err != nil {
//		fmt.Println(err)
//	}
//}

//func insert(newData lib.Positions) {
//	start := time.Now()
//	tx := DB.MustBegin()
//
//	for _, position := range newData {
//		_, err := tx.NamedExec(persistQuery, position)
//		if err != nil {
//			fmt.Println(err)
//		}
//	}
//	fmt.Println("Inserted", len(newData), "positions")
//
//	err := tx.Commit()
//	if err != nil {
//		fmt.Println(err)
//	}
//
//	elapsed := time.Since(start)
//	fmt.Println("Insert took", elapsed)
//}



func subscribe(r *rejonson.Client, redisSubChannel string, db *sqlx.DB) {
	pubsub := r.Subscribe(redisSubChannel)
	ch := pubsub.Channel()

	ticker := time.NewTicker(time.Second * 5)
	defer ticker.Stop()

	persistedCount := 0

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				break
			}

			//deserialize so we can get the ICAO.
			var pos pkg.Position
			err := json.Unmarshal([]byte(msg.Payload), &pos) //get msg string, convert to byte array for unmarshal
			if err != nil {
				log.Fatal("unmarshal error", err)
			}

			//only persist if we have an ICAO, persisting an empty ICAO erases the ReJSON container
			if pos.Icao != "" {
				tx := db.MustBegin()

				_, err := tx.NamedExec(persistQuery, pos)
				if err != nil {
					fmt.Println(err)
					tx.Rollback()
					break
				}

				err = tx.Commit()
				if err != nil {
					fmt.Println(err)
					tx.Rollback()
					break
				}
				persistedCount++
			}
		case <-ticker.C:
			fmt.Println(persistedCount, "positions saved in past 5 seconds")
			persistedCount = 0
		}
	}
}

func main() {

	redisSubChannel := os.Getenv("REDIS_SUB_CHANNEL")
	redisAddress := os.Getenv("REDIS_ADDRESS")
	redisPort := os.Getenv("REDIS_PORT")

	dbUsername := os.Getenv("PIPELINEDB_USERNAME")
	dbPassword := os.Getenv("PIPELINEDB_PASSWORD")
	dbHost := os.Getenv("PIPELINEDB_HOST")
	dbName := os.Getenv("PIPELINEDB_DBNAME")


	for _,v := range([]string{redisSubChannel, redisAddress, redisPort, dbUsername, dbPassword, dbHost, dbName}) {
		if v == "" {
			panic(fmt.Sprintf("%s env variable not provided", v))
		}
	}

	reJsonClient := pkg.ProvideReJSONClient(fmt.Sprintf("%s:%s",
		redisAddress, redisPort))


	dsn := fmt.Sprintf("postgres://%s:%s@%s/%s", dbUsername, dbPassword, dbHost, dbName)
	var dbClient = sqlx.MustConnect("pgx", dsn)

	go subscribe(reJsonClient, redisSubChannel, dbClient)

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
