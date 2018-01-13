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

var adsb_feed struct {
	AcList adsb_list
}

func getAdsbData() adsb_list {
	resp, err := http.Get("http://public-api.adsbexchange.com/VirtualRadar/AircraftList.json")
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	bodyBytes, err := ioutil.ReadAll(resp.Body)
	err = json.Unmarshal(bodyBytes, &adsb_feed)

	if err != nil {
		fmt.Println(err)
	}
	return adsb_feed.AcList
}

func main() {
	fmt.Print(getAdsbData())
}
