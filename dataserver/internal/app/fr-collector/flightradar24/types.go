package flightradar24

import (
	"encoding/json"
)

type Fr_Record struct {
	Icao         string
	Lat          float64
	Lng          float64
	Heading      float64
	Altitude     int
	Speed        int
	Squawk       string
	Radar        string
	Model        string
	Registration string
	Time         int64
	Origin       string
	Destination  string
	Flight       string
	OnGround     bool
	RateOfClimb  int
	Callsign     string
	IsGlider     bool
}

type fr_raw map[string]json.RawMessage
