package lib

import (
	"encoding/json"
	"fmt"
	"github.com/asaskevich/govalidator"
	"github.com/shopspring/decimal"
	"math"
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

func normalizeAdsbData(rawPositions adsbList) FlightHistory {
	var normalData FlightHistory

	for _, record := range rawPositions {
		var normalized Position

		//copy values
		normalized.Icao = record.Icao
		normalized.Lat = record.Lat
		normalized.Lng = record.Long
		normalized.Heading = record.Trak

		normalized.Time = time.Now().UTC()

		//convert feet to meters, round down to nearest meter
		normalized.Altitude = int32(math.Floor(record.Galt / 3.2808399))

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
		govalidator.InRangeFloat64(float64(record.Altitude), -500, 100000)
	// time?

	validatorB := record.Lat != 0 || record.Lng != 0

	return validatorA && validatorB
}

func validateFlightData(normalData FlightHistory) FlightHistory {
	var validData FlightHistory

	for _, record := range normalData {
		if validator(record) {
			validData = append(validData, record)
		}
	}
	return validData
}

func decreasePrecisionOfRecord(record Position, p precisionStandards) Position {
	newLat, _ := decimal.NewFromFloat(record.Lat).Round(p.coordinates).Float64()
	record.Lat = newLat

	newLng, _ := decimal.NewFromFloat(record.Lng).Round(p.coordinates).Float64()
	record.Lng = newLng

	newHeading, _ := decimal.NewFromFloat(record.Heading).Round(p.heading).Float64()
	record.Heading = newHeading

	return record
}

func decreasePrecisionOfDataset(data FlightHistory, p precisionStandards) FlightHistory {
	var dpFlights FlightHistory
	for _, val := range data {
		dpFlights = append(dpFlights, decreasePrecisionOfRecord(val, p))
	}
	return dpFlights
}

func Clean(inChan chan []byte, outChan chan FlightHistory) {
	for {
		select {
		case raw := <-inChan:
			rawPositions := getRawAdsbData(raw)
			normalizedPositions := normalizeAdsbData(rawPositions)
			validatedPositions := validateFlightData(normalizedPositions)
			deaccurizedPositions := decreasePrecisionOfDataset(validatedPositions, GlobalPrecision)
			outChan <- deaccurizedPositions
		}
	}
}
