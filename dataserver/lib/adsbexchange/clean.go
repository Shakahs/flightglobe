package adsbexchange

import (
	"encoding/json"
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/lib"
	"github.com/asaskevich/govalidator"
	"math"
	"strconv"
	"time"
)

func getRawAdsbData(resp []byte) adsbList {
	var unmarshaledData AdsbFeed
	err := json.Unmarshal(resp, &unmarshaledData)

	if err != nil {
		fmt.Println(err)
	}

	return unmarshaledData.AcList
}

func normalizeAdsbData(rawPositions adsbList) lib.FlightHistory {
	var normalData lib.FlightHistory

	for _, record := range rawPositions {
		var normalized lib.Position

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

func validator(record lib.Position) bool {
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

func validateFlightData(normalData lib.FlightHistory) lib.FlightHistory {
	var validData lib.FlightHistory

	for _, record := range normalData {
		if validator(record) {
			validData = append(validData, record)
		}
	}
	return validData
}

func Clean(inChan chan []byte, outChan chan lib.FlightHistory) {
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
