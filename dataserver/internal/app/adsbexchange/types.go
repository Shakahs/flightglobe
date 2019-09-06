package adsbexchange

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
