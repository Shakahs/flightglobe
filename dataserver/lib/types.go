package lib

import (
	"time"
)

type Position struct {
	Id       int64     `json:"-"`
	Icao     string    `json:"-"`
	Lat      float64   `json:"lat"`
	Lng      float64   `json:"lon"`
	Time     time.Time `json:"time" db:"ptime"`
	Heading  float64   `json:"heading"`
	Altitude int32     `json:"altitude"` // meters
}

type FlightHistory = []Position

type FlightDataSet map[string]Position

type DataExport struct {
	channel string
	data    FlightDataSet
}

type precisionStandards struct {
	coordinates int32
	altitude    int32
	heading     int32
	geohash     uint
}

