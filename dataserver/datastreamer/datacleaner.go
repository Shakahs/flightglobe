package datastreamer

import (
	"encoding/json"
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/types"
	"github.com/asaskevich/govalidator"
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

func getRawAdsbData(resp []byte) adsbList {
	var unmarshaledData AdsbFeed
	err := json.Unmarshal(resp, &unmarshaledData)

	if err != nil {
		fmt.Println(err)
	}

	return unmarshaledData.AcList
}

func normalizeAdsbData(rawPositions adsbList) types.FlightHistory {
	var normalData types.FlightHistory

	for _, record := range rawPositions {
		var normalized types.Position

		//copy values
		normalized.Icao = record.Icao
		normalized.Lat = record.Lat
		normalized.Lng = record.Long
		normalized.Heading = record.Trak

		normalized.Time = time.Now().UTC()

		//convert feet to meters
		normalized.Altitude = record.Galt / 3.2808399

		normalData = append(normalData, normalized)
	}

	return normalData
}

func validator(record types.Position) bool {
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

func validateFlightData(normalData types.FlightHistory) types.FlightHistory {
	var validData types.FlightHistory

	for _, record := range normalData {
		if validator(record) {
			validData = append(validData, record)
		}
	}
	return validData
}

func Clean(inChan chan []byte, outChan chan types.FlightHistory) {
	for {
		select {
		case raw := <-inChan:
			rawPositions := getRawAdsbData(raw)
			normalizedPositions := normalizeAdsbData(rawPositions)
			validatedPositions := validateFlightData(normalizedPositions)
			outChan <- validatedPositions
		}
	}
}
