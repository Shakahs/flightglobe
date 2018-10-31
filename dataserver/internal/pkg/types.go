package pkg

import (
	"sync"
	"time"
)

type Position struct {
	Id          int64     `json:"-"`
	Icao        string    `json:"icao"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Time        time.Time `json:"time" db:"ptime2"`
	Heading     float64   `json:"heading"`
	Altitude    int32     `json:"altitude"` // feet
	Model       string    `json:"model"`
	Origin      string    `json:"origin"`
	Destination string    `json:"destination"`
}

type Positions = []Position

type SinglePositionDataset map[string]*Position

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

type PositionRequest struct {
	LastReceived time.Time `json:"lastReceived"`
}

type LockableSinglePositionDataset struct {
	data SinglePositionDataset
	lock sync.RWMutex
}

type PositionUpdate struct {
	Type string    `json:"type"`
	Body *Position `json:"body"`
}
