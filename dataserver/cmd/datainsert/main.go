package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/types"
	_ "github.com/jackc/pgx/stdlib"
	"github.com/jmoiron/sqlx"
)

func main() {
	db := sqlx.MustConnect("pgx", "postgres://flightglobe:flightglobe@localhost/flightglobe")

	res := []types.Position{}
	err := db.Select(&res, "SELECT * FROM positions")
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(&res)

	newPos := types.Position{
		Icao:     "55",
		Lat:      11,
		Lng:      22,
		Altitude: 55,
		Heading:  44,
	}

	query := `INSERT INTO positions(lat, lng, heading, altitude,icao) 
          VALUES(:lat, :lng, :heading, :altitude, :icao)`

	_, err = db.NamedExec(query, newPos)
	if err != nil {
		fmt.Println(err)
	}

}
