package main

import (
	"encoding/json"
	"fmt"
	"github.com/asaskevich/govalidator"
	"io/ioutil"
	"net/http"
	"strconv"
	"time"
)

type adsb_record struct { //altitude is in feet
	Id           string `json:"Icao"`
	Lat          float64
	Lng          float64 `json:"Long"`
	Timestamp    int64   `json:"PosTime"` //timestamp with nanosecond
	Time         time.Time
	Heading      float32 `json:"Trak"`
	AltitudeFeet float32 `json:"Galt"`
	Altitude     float32 // meters
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

func convertAdsbData(record *adsb_record) {
	//convert timestamp to native time type
	timeStringWithNano := strconv.FormatInt(record.Timestamp, 10)
	timeStringUnix := timeStringWithNano[0 : len(timeStringWithNano)-3]
	timeStampUnix, _ := strconv.ParseInt(timeStringUnix, 10, 32)
	record.Time = time.Unix(timeStampUnix, 0)

	//convert feet to meters
	record.Altitude = record.AltitudeFeet / 3.2808399
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
		govalidator.InRangeFloat32(record.Altitude, -500, 30000)
}

func main() {
	rawFlightData := getAdsbData()
	var validatedData []adsb_record

	for _, val := range rawFlightData {
		if validateAdsbData(val) {
			convertAdsbData(&val)
			validatedData = append(validatedData, val)
		}
	}

	fmt.Print(validatedData)
}
