package types

import (
	"time"
	"sync"
)

type Position struct {
	Icao     string    `json:"icao,omitempty"`
	Lat      float64   `json:"lat"`
	Lng      float64   `json:"lon"`
	Time     time.Time `json:"time"`
	Heading  float64   `json:"heading"`
	Altitude float64   `json:"altitude"` // meters
}

type FlightHistory = []Position

type FlightDataSet map[string]FlightHistory

type LockableFlightDataSet = struct{
	sync.RWMutex
	FlightData FlightDataSet
}

var AllFlights = LockableFlightDataSet{FlightData: make(FlightDataSet)}
