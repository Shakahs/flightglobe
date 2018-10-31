package pkg

import (
	"sync"
	"time"
)

type Position struct {
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Time      time.Time `json:"time" db:"ptime2"`
	Heading   float64   `json:"heading"`
	Altitude  int32     `json:"altitude"` // feet
}

type Demographic struct {
	Model       string `json:"model"`
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
}
type FlightRecord struct {
	Icao        string `json:"icao"`
	Position    Position
	Demographic Demographic
}

type FlightRecords = []FlightRecord

type RecordMap map[string]*FlightRecord

type precisionStandards struct {
	coordinates int32
	altitude    int32
	heading     int32
	geohash     uint
}

type PositionRequest struct {
	LastReceived time.Time `json:"lastReceived"`
}

type LockableRecordMap struct {
	data RecordMap
	lock sync.RWMutex
}

type PositionUpdate struct {
	Type string    `json:"type"`
	Icao string    `json:"icao"`
	Body *Position `json:"body"`
}
