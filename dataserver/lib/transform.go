package lib

func CreateMap(data FlightHistory) FlightDataSet {
	var newMap = make(FlightDataSet)
	for _, pos := range data {
		newMap[pos.Icao] = FlightHistory{pos}
	}
	return newMap
}
