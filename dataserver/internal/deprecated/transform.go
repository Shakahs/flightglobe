package deprecated

//
//func decreasePrecisionOfRecord(record Position, p precisionStandards) Position {
//	newLat, _ := decimal.NewFromFloat(record.Latitude).Round(p.coordinates).Float64()
//	record.Latitude = newLat
//
//	newLng, _ := decimal.NewFromFloat(record.Lng).Round(p.coordinates).Float64()
//	record.Lng = newLng
//
//	newHeading, _ := decimal.NewFromFloat(record.Heading).Round(p.heading).Float64()
//	record.Heading = newHeading
//
//	return record
//}
//
//func DecreasePrecisionOfDataset(data Positions, p precisionStandards) Positions {
//	var dpFlights Positions
//	for _, val := range data {
//		dpFlights = append(dpFlights, decreasePrecisionOfRecord(val, p))
//	}
//	return dpFlights
//}
//
//func CreateSinglePositionMap(data Positions) SinglePositionDataset {
//	var newMap = make(SinglePositionDataset)
//	for _, pos := range data {
//		newMap[pos.Icao] = pos
//	}
//	return newMap
//}
//
//func CreateMultiplePositionMap(data Positions) MultiplePositionDataset {
//	var newMap = make(MultiplePositionDataset)
//	for _, pos := range data {
//		newMap[pos.Icao] = append(newMap[pos.Icao], pos)
//	}
//	return newMap
//}
