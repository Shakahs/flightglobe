package lib

import "github.com/shopspring/decimal"

func decreasePrecisionOfRecord(record Position, p precisionStandards) Position {
	newLat, _ := decimal.NewFromFloat(record.Lat).Round(p.coordinates).Float64()
	record.Lat = newLat

	newLng, _ := decimal.NewFromFloat(record.Lng).Round(p.coordinates).Float64()
	record.Lng = newLng

	newHeading, _ := decimal.NewFromFloat(record.Heading).Round(p.heading).Float64()
	record.Heading = newHeading

	return record
}

func DecreasePrecisionOfDataset(data FlightHistory, p precisionStandards) FlightHistory {
	var dpFlights FlightHistory
	for _, val := range data {
		dpFlights = append(dpFlights, decreasePrecisionOfRecord(val, p))
	}
	return dpFlights
}

func CreateMap(data FlightHistory) FlightDataSet {
	var newMap = make(FlightDataSet)
	for _, pos := range data {
		//icao := pos.Icao
		//pos.Icao = ""
		newMap[pos.Icao] = append(newMap[pos.Icao],pos)
	}
	return newMap
}
