package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/shopspring/decimal"
	"net/http"
)

var GlobalPrecision = PrecisionStandards{2, 0, 0}
var LocalPrecision = PrecisionStandards{2, 0, 0}

type PrecisionStandards struct {
	coordinates int32
	altitude    int32
	heading     int32
}

func decreasePrecision(record *FlightRecord, p PrecisionStandards) *FlightRecord {
	newRecord := &FlightRecord{}
	*newRecord = *record

	newLat, _ := decimal.NewFromFloat(record.Lat).Round(p.coordinates).Float64()
	newRecord.Lat = newLat

	newLng, _ := decimal.NewFromFloat(record.Lng).Round(p.coordinates).Float64()
	newRecord.Lng = newLng

	newAltitude, _ := decimal.NewFromFloat(record.Altitude).Round(p.altitude).Float64()
	newRecord.Altitude = newAltitude

	newHeading, _ := decimal.NewFromFloat(record.Heading).Round(p.heading).Float64()
	newRecord.Heading = newHeading

	return newRecord
}

func SendGlobalFeed() {
	var dpFlights = []*FlightRecord{}
	for _, val := range AllFlights {
		dpFlights = append(dpFlights, decreasePrecision(&val, GlobalPrecision))
	}
	jsonValue, _ := json.Marshal(dpFlights)
	_, err := http.Post("http://localhost:8080/pub", "application/json", bytes.NewBuffer(jsonValue))
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Sent", len(AllFlights), "flights downstream")
}
