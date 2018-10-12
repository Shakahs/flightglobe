package scrape

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/types"
	"net"
	"net/http"
	"time"
)

//type precisionStandards struct {
//	coordinates int32
//	altitude    int32
//	heading     int32
//	geohash     uint
//}
//
////var globalPrecision = precisionStandards{3, 0, 0, 1}
//var localPrecision = precisionStandards{4, 0, 0, 3}
//
type dataExport struct {
	channel string
	data    types.LockableFlightDataSet
}

//
//func decreasePrecisionOfRecord(record Position, p precisionStandards) Position {
//	newLat, _ := decimal.NewFromFloat(record.Latitude).Round(p.coordinates).Float64()
//	record.Latitude = newLat
//
//	newLng, _ := decimal.NewFromFloat(record.Lng).Round(p.coordinates).Float64()
//	record.Lng = newLng
//
//	newAltitude, _ := decimal.NewFromFloat(record.Altitude).Round(p.altitude).Float64()
//	record.Altitude = newAltitude
//
//	newHeading, _ := decimal.NewFromFloat(record.Heading).Round(p.heading).Float64()
//	record.Heading = newHeading
//
//	return record
//}
//
//func decreasePrecisionOfDataset(data FlightList, p precisionStandards) FlightList {
//	var dpFlights FlightList
//	for _, val := range data {
//		dpFlights = append(dpFlights, decreasePrecisionOfRecord(val, p))
//	}
//	return dpFlights
//}
//
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
			go func(export dataExport) {
				defer func() { <-rateLimit }()
				export.data.RLock()
				jsonValue, _ := json.Marshal(export.data.FlightData)
				export.data.RUnlock()
				resp, err := nChanClient.Post("http://localhost:8080/pub/"+export.channel, "application/json", bytes.NewBuffer(jsonValue))
				if err == nil {
					defer resp.Body.Close()
				} else {
					fmt.Println(err)
				}
			}(export)
		}
	}
}

func SendGlobalFeed() {
	//globalData := decreasePrecisionOfDataset(AllFlights, localPrecision)
	nchan <- dataExport{"global", types.AllFlights}
	fmt.Println("Sent", len(types.AllFlights.FlightData), "flights to", "global")
}

//
//func SendLocalFeeds() {
//	localData := decreasePrecisionOfDataset(AllFlights, localPrecision)
//
//	hashedLocations := make(map[string]FlightList)
//	for _, val := range localData {
//		hash := geohash.EncodeWithPrecision(val.Latitude, val.Lng, localPrecision.geohash)
//		hashedLocations[hash] = append(hashedLocations[hash], val)
//	}
//
//	for key, data := range hashedLocations {
//		nchan <- dataExport{key, data}
//	}
//
//	fmt.Println("Sent", len(localData), "flights to", len(hashedLocations), "channels")
//}
