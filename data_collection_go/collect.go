package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"encoding/json"
	//"github.com/asaskevich/govalidator"
)

type adsb_record struct {
	Id string `json:"Icao"`
	Lat float64
	Lng float64 `json:"Long"`
	Time int64 `json:"PosTime"`
	Heading float32 `json:"Trak"`
	Altitude int64 `json:"Galt"`
}

type adsb_list = []adsb_record

type adsb_feed struct {
	AcList adsb_list
}

func getAdsbData() adsb_list {
	resp, err := http.Get("http://public-api.adsbexchange.com/VirtualRadar/AircraftList.json")
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	var unmarshaledData adsb_feed
	bodyBytes, err := ioutil.ReadAll(resp.Body)
	err = json.Unmarshal(bodyBytes, &unmarshaledData)

	if err != nil {
		fmt.Println(err)
	}
	return unmarshaledData.AcList
}

func main() {
	flightData := getAdsbData()
	fmt.Print(flightData)
}
