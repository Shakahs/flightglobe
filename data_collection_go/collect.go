package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"github.com/asaskevich/govalidator"
)

type adsb_record struct { //altitude is in feet
	Id       string `json:"Icao"`
	Lat      float64
	Lng      float64 `json:"Long"`
	Time     int64   `json:"PosTime"`
	Heading  float32 `json:"Trak"`
	Altitude int   `json:"Galt"`
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

func validateAdsbData(record adsb_record) bool {
	//Icao id
	return govalidator.IsAlphanumeric(record.Id) &&
		govalidator.IsByteLength(record.Id, 3, 10) &&
		// latitude
		record.Lat != 0 &&
		govalidator.IsLatitude(strconv.FormatFloat(record.Lat, 'f', -1, 64)) &&
		// longitude
		record.Lng != 0 &&
		govalidator.IsLongitude(strconv.FormatFloat(record.Lng, 'f', -1, 64)) &&
		// heading
		govalidator.InRangeFloat32(record.Heading, 0, 360) &&
		// altitude
		govalidator.InRangeInt(record.Altitude, -1000, 100000)

}

func main() {
	flightData := getAdsbData()
	var validData []adsb_record

	for _, val := range flightData {
		if validateAdsbData(val) {
			validData = append(validData, val)
		}
	}

	fmt.Print(validData)
}
