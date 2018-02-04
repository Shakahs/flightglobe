package types

import (
	"sync"
	"time"
)

type Position struct {
	Id       int
	Icao     string    `json:"icao,omitempty"`
	Lat      float64   `json:"lat"`
	Lng      float64   `json:"lon"`
	Time     time.Time `json:"time" db:"ptime"`
	Heading  float64   `json:"heading"`
	Altitude float64   `json:"altitude"` // meters
}

type FlightHistory = []Position

type FlightDataSet map[string]FlightHistory

type LockableFlightDataSet = struct {
	sync.RWMutex
	FlightData FlightDataSet
}

var AllFlights = LockableFlightDataSet{FlightData: make(FlightDataSet)}
