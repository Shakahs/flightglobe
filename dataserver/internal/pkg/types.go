package pkg

type Position struct {
	Id       int64   `json:"-"`
	Icao     string  `json:"icao"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lon"`
	Time     int64   `json:"time" db:"ptime2"`
	Heading  float64 `json:"heading"`
	Altitude int32   `json:"altitude"` // meters
}

type Positions = []Position

type SinglePositionDataset map[string]Position

type MultiplePositionDataset map[string]Positions

type OutgoingSinglePositionDataset struct {
	channel string
	data    SinglePositionDataset
}

type OutgoingFlightHistory struct {
	channel string
	data    Positions
}

type precisionStandards struct {
	coordinates int32
	altitude    int32
	heading     int32
	geohash     uint
}
