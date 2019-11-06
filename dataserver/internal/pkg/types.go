package pkg

import (
	"encoding/json"
	"sync"
	"time"
)

type Position struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Timestamp int64   `json:"timestamp"`
	Heading   float64 `json:"heading"`
	Altitude  int32   `json:"altitude"` // feet
	Geohash   string  `json:"geohash"`
}

type Demographic struct {
	Model       string `json:"model"`
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
}
type FlightRecord struct {
	Icao        string
	Position    Position
	Demographic Demographic
	Time        time.Time
	Source      string
}

func (fr FlightRecord) MarshalBinary() ([]byte, error) {
	return json.Marshal(fr)
}

func (fr *FlightRecord) UnmarshalBinary(raw []byte) error {
	return json.Unmarshal(raw, fr)
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
	LastReceivedTimestamp int64 `json:"lastReceivedTimestamp"`
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

type DemographicUpdate struct {
	Type string       `json:"type"`
	Icao string       `json:"icao"`
	Body *Demographic `json:"body"`
}

type Airport struct {
	IATA    string `json:"iata"`
	City    string `json:"city"`
	Country string `json:"country"`
}

type AirportMap map[string]Airport
