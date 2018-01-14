package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/mmcloughlin/geohash"
	"github.com/shopspring/decimal"
	"net"
	"net/http"
	"time"
)

type PrecisionStandards struct {
	coordinates int32
	altitude    int32
	heading     int32
	geohash     uint
}

var globalPrecision = PrecisionStandards{3, 0, 0, 1}
var localPrecision = PrecisionStandards{4, 0, 0, 3}

type dataExport struct {
	channel string
	data    FlightList
}

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

var rateLimit = make(chan bool, 500)
var nchan = make(chan dataExport)

var nChanClient = http.Client{
	Transport: &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,
			KeepAlive: 0,
		}).DialContext,
		DisableKeepAlives: true,
	},
}

func SendToEndpoint() {
	for {
		select {
		case export := <-nchan:
			rateLimit <- true
			go func(val FlightList) {
				defer func() { <-rateLimit }()
				jsonValue, _ := json.Marshal(val)
				resp, err := nChanClient.Post("http://localhost:8080/pub/"+export.channel, "application/json", bytes.NewBuffer(jsonValue))
				if err == nil {
					defer resp.Body.Close()
				} else {
					fmt.Println(err)
				}
			}(export.data)
		}
	}
}

func SendGlobalFeed() {
	globalData := decreasePrecisionOfDataset(AllFlights, globalPrecision)
	nchan <- dataExport{"global", globalData}
	fmt.Println("Sent", len(globalData), "flights to", "global")
}

func SendLocalFeeds() {
	localData := decreasePrecisionOfDataset(AllFlights, localPrecision)

	hashedLocations := make(map[string]FlightList)
	for _, val := range localData {
		hash := geohash.EncodeWithPrecision(val.Lat, val.Lng, localPrecision.geohash)
		hashedLocations[hash] = append(hashedLocations[hash], val)
	}

	for key, value := range hashedLocations {
		nchan <- dataExport{key, value}
	}

	fmt.Println("Sent", len(localData), "flights to", len(hashedLocations), "channels")
}
