package datastreamer

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/types"
	_ "github.com/jackc/pgx/stdlib"
	"github.com/jmoiron/sqlx"
	"time"
)

var db = sqlx.MustConnect("pgx",
	"postgres://flightglobe:flightglobe@localhost/flightglobe")
var query = `INSERT INTO positions(lat, lng, heading, altitude,icao) 
          VALUES(:lat, :lng, :heading, :altitude, :icao)`

func insert(newData types.FlightHistory) {
	start := time.Now()
	tx := db.MustBegin()

	for _, position := range newData {
		_, err := tx.NamedExec(query, position)
		if err != nil {
			fmt.Println(err)
		}
	}
	fmt.Println("Inserted", len(newData), "positions")

	err := tx.Commit()
	if err != nil {
		fmt.Println(err)
	}

	elapsed := time.Since(start)
	fmt.Println("Insert took %s", elapsed)
}

func Persist(inChan chan types.FlightHistory) {
	for {
		select {
		case r := <-inChan:
			go insert(r)
		}
	}
}
