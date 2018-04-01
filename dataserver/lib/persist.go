package lib

import (
	"fmt"
	"time"
)

var persistQuery = `INSERT INTO positions(lat, lng, heading, altitude,icao) 
          VALUES(:lat, :lng, :heading, :altitude, :icao)`

func insert(newData Positions) {
	start := time.Now()
	tx := DB.MustBegin()

	for _, position := range newData {
		_, err := tx.NamedExec(persistQuery, position)
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
	fmt.Println("Insert took", elapsed)
}

func Persist(inChan chan Positions) {
	for {
		select {
		case r := <-inChan:
			go insert(r)
		}
	}
}
