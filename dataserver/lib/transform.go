package lib

func CreateMap(data FlightHistory) FlightDataSet {
	var newMap = make(FlightDataSet)
	for _, pos := range data {
		icao := pos.Icao
		pos.Icao = ""
		newMap[icao] = FlightHistory{pos}
	}
	return newMap
}
