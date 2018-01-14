package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/shopspring/decimal"
	"net/http"
)

type PrecisionStandards struct {
	coordinates int32
	altitude    int32
	heading     int32
}

var GlobalPrecision = PrecisionStandards{3, 0, 0}
var LocalPrecision = PrecisionStandards{4, 0, 0}

func decreasePrecisionOfRecord(record FlightRecord, p PrecisionStandards) FlightRecord {
	newLat, _ := decimal.NewFromFloat(record.Lat).Round(p.coordinates).Float64()
	record.Lat = newLat

	newLng, _ := decimal.NewFromFloat(record.Lng).Round(p.coordinates).Float64()
	record.Lng = newLng

	newAltitude, _ := decimal.NewFromFloat(record.Altitude).Round(p.altitude).Float64()
	record.Altitude = newAltitude

	newHeading, _ := decimal.NewFromFloat(record.Heading).Round(p.heading).Float64()
	record.Heading = newHeading

	return record
}

func decreasePrecisionOfDataset(data FlightList, p PrecisionStandards) FlightList {
	var dpFlights FlightList
	for _, val := range data {
		dpFlights = append(dpFlights, decreasePrecisionOfRecord(val, p))
	}
	return dpFlights
}

func sendToEndpoint(channel string, data FlightList) {
	jsonValue, _ := json.Marshal(data)
	_, err := http.Post("http://localhost:8080/pub/"+channel, "application/json", bytes.NewBuffer(jsonValue))
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Sending to", channel, "done")
}

func SendGlobalFeed() {
	globalFeed := decreasePrecisionOfDataset(AllFlights, GlobalPrecision)
	go sendToEndpoint("global", globalFeed)
	fmt.Println("Sent", len(AllFlights), "flights downstream")
}
