package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/asaskevich/govalidator"
	"io/ioutil"
	"net/http"
	"strconv"
	"time"
)

type adsbRecord struct { //altitude is in feet
	Icao    string
	Lat     float64
	Long    float64
	PosTime int64 //timestamp with nanosecond
	Trak    float32
	Galt    float32 //altitude in feet
}

type adsbList = []adsbRecord

type AdsbFeed struct {
	AcList adsbList
}

func getRawAdsbData() adsbList {
	resp, err := http.Get("http://public-api.adsbexchange.com/VirtualRadar/AircraftList.json")
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	var unmarshaledData AdsbFeed
	bodyBytes, err := ioutil.ReadAll(resp.Body)
	err = json.Unmarshal(bodyBytes, &unmarshaledData)

	if err != nil {
		fmt.Println(err)
	}
	return unmarshaledData.AcList
}

func convertAdsbData(record *adsbRecord) (FlightRecord, error) {
	var flight FlightRecord

	//copy values
	flight.Id = record.Icao
	flight.Lat = record.Lat
	flight.Lng = record.Long
	flight.Heading = record.Trak

	//convert timestamp to native time type
	if record.PosTime == 0 {
		return flight, errors.New("Invalid time")
	}
	timeStringWithNano := strconv.FormatInt(record.PosTime, 10)
	timeStringUnix := timeStringWithNano[0 : len(timeStringWithNano)-3]
	timeStampUnix, _ := strconv.ParseInt(timeStringUnix, 10, 32)
	flight.Time = time.Unix(timeStampUnix, 0)

	//convert feet to meters
	flight.Altitude = record.Galt / 3.2808399
	return flight, nil
}

func validateFlightData(record FlightRecord) bool {
	validatorA := govalidator.IsAlphanumeric(record.Id) && //Icao id
		govalidator.IsByteLength(record.Id, 3, 10) &&
		// latitude
		govalidator.IsLatitude(strconv.FormatFloat(record.Lat, 'f', -1, 64)) &&
		// longitude
		govalidator.IsLongitude(strconv.FormatFloat(record.Lng, 'f', -1, 64)) &&
		// heading
		govalidator.InRangeFloat32(record.Heading, 0, 360) &&
		// altitude
		govalidator.InRangeFloat32(record.Altitude, -500, 30000)

	validatorB := record.Lat != 0 || record.Lng != 0

	return validatorA && validatorB
}

func GetAdsbData() {
	rawFlightData := getRawAdsbData()
	var processedData []FlightRecord

	for _, val := range rawFlightData {
		convertedRecord, err := convertAdsbData(&val)
		if err == nil && validateFlightData(convertedRecord) {
			processedData = append(processedData, convertedRecord)
		}
	}
	AllFlights = processedData
	fmt.Println("Retrieved", len(AllFlights), "flights from ADSB")
}

func SendAdsbData() {
	jsonValue, _ := json.Marshal(AllFlights)
	_, err := http.Post("http://localhost:8080/pub", "application/json", bytes.NewBuffer(jsonValue))
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Sent", len(AllFlights), "flights downstream")
}
