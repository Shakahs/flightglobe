package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/mmcloughlin/geohash"
	"github.com/shopspring/decimal"
	"net/http"
)

type PrecisionStandards struct {
	coordinates int32
	altitude    int32
	heading     int32
	geohash     uint
}

var globalPrecision = PrecisionStandards{3, 0, 0, 1}
var localPrecision = PrecisionStandards{4, 0, 0, 3}

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
	fmt.Println("Sent", len(data), "flights to", channel)
}

func SendGlobalFeed() {
	globalData := decreasePrecisionOfDataset(AllFlights, globalPrecision)
	go sendToEndpoint("global", globalData)
}

func SendLocalFeeds() {
	localData := decreasePrecisionOfDataset(AllFlights, localPrecision)

	hashedLocations := make(map[string]FlightList)
	for _, val := range localData {
		hash := geohash.EncodeWithPrecision(val.Lat, val.Lng, localPrecision.geohash)
		hashedLocations[hash] = append(hashedLocations[hash], val)
	}

	for key, value := range hashedLocations {
		go sendToEndpoint(key, value)
	}
}
