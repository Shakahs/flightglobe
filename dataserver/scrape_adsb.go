package dataserver

import (
	"encoding/json"
	//"errors"
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
	Trak    float64
	Galt    float64 //altitude in feet
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

func normalizeAdsbData(rawPositions adsbList) (FlightHistory) {
	var normalData FlightHistory

	for _, record := range rawPositions {
		var normalized Position

		//copy values
		normalized.Icao = record.Icao
		normalized.Lat = record.Lat
		normalized.Lng = record.Long
		normalized.Heading = record.Trak

		//convert timestamp to native time type
		if record.PosTime == 0 {
			normalized.Time=time.Unix(0, 0)
		} else {
			timeStringWithNano := strconv.FormatInt(record.PosTime, 10)
			timeStringUnix := timeStringWithNano[0 : len(timeStringWithNano)-3]
			timeStampUnix, _ := strconv.ParseInt(timeStringUnix, 10, 32)
			normalized.Time = time.Unix(timeStampUnix, 0)
		}

		//convert feet to meters
		normalized.Altitude = record.Galt / 3.2808399

		normalData = append(normalData, normalized)
	}

	return normalData
}

func validator(record Position) bool {
	validatorA := govalidator.IsAlphanumeric(record.Icao) && //Icao id
		govalidator.IsByteLength(record.Icao, 3, 10) &&
		// latitude
		govalidator.IsLatitude(strconv.FormatFloat(record.Lat, 'f', -1, 64)) &&
		// longitude
		govalidator.IsLongitude(strconv.FormatFloat(record.Lng, 'f', -1, 64)) &&
		// heading
		govalidator.InRangeFloat64(record.Heading, 0, 360) &&
		// altitude
		govalidator.InRangeFloat64(record.Altitude, -500, 30000)
		// time?

	validatorB := record.Lat != 0 || record.Lng != 0

	return validatorA && validatorB
}

func validateFlightData(normalData FlightHistory) FlightHistory {
	var validData FlightHistory

	for _, record := range normalData {
		if validator(record){
			validData = append(validData, record)
		}
	}

	return validData
}

func GetAdsbData() {
	rawPositions := getRawAdsbData()
	normalizedPositions := normalizeAdsbData(rawPositions)
	validatedPositions := validateFlightData(normalizedPositions)

	AllFlights.Lock()
	for _, position := range validatedPositions {
		id := position.Icao
		position.Icao =""
		AllFlights.FlightData[id] = FlightHistory{position}
	}
	AllFlights.Unlock()

	fmt.Println("Retrieved", len(AllFlights.FlightData), "flights from ADSB")

	//var processedData []Position
	//
	//for _, val := range rawPositions {
	//	convertedRecord, err := normalizeAdsbData(&val)
	//	if err == nil && validateFlightData(convertedRecord) {
	//		processedData = append(processedData, convertedRecord)
	//	}
	//}
	//
	//AllFlights = processedData
	//fmt.Println("Retrieved", len(AllFlights), "flights from ADSB")
}
