package lib

import (
	"sync"
	"time"
)

type Position struct {
	Id       int64     `json:"-"`
	Icao     string    `json:"icao,omitempty"`
	Lat      float64   `json:"lat"`
	Lng      float64   `json:"lon"`
	Time     time.Time `json:"time" db:"ptime"`
	Heading  float64   `json:"heading"`
	Altitude int32     `json:"altitude"` // meters
}

type FlightHistory = []Position

type FlightDataSet map[string]FlightHistory

type LockableFlightDataSet = struct {
	sync.RWMutex
	FlightData FlightDataSet
}

type DataExport struct {
	channel string
	data    FlightDataSet
}
