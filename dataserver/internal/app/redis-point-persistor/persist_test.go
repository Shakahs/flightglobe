package redis_point_persistor

import (
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"testing"
)

func TestIsPositionValid(t *testing.T) {

	testTable := []struct {
		pos            pkg.FlightRecord
		expectedResult bool
	}{
		{pos: pkg.FlightRecord{Icao: "abc"}, expectedResult: true},
		{pos: pkg.FlightRecord{}, expectedResult: false},
	}

	for _, entry := range testTable {
		actualResult := isPositionValid(entry.pos)
		if actualResult != entry.expectedResult {
			t.Errorf("Validation result of %s incorrect, got: %t, want: %t.",
				entry.pos.Icao, actualResult, entry.expectedResult)
		}
	}
}

func TestArePositionsIdentical(t *testing.T) {

	testTable := []struct {
		oldPos         pkg.FlightRecord
		newPos         pkg.FlightRecord
		expectedResult bool
	}{
		{
			oldPos:         pkg.FlightRecord{Latitude: 99, Longitude: 99},
			newPos:         pkg.FlightRecord{Latitude: 99, Longitude: 99},
			expectedResult: true,
		},
		{
			oldPos:         pkg.FlightRecord{Latitude: 99, Longitude: 99},
			newPos:         pkg.FlightRecord{Latitude: 98, Longitude: 99},
			expectedResult: false,
		},
		{
			oldPos:         pkg.FlightRecord{Latitude: 99, Longitude: 99},
			newPos:         pkg.FlightRecord{Latitude: 99, Longitude: 98},
			expectedResult: false,
		},
	}

	for _, entry := range testTable {
		actualResult := arePositionsIdentical(entry.oldPos, entry.newPos)
		if actualResult != entry.expectedResult {
			t.Errorf("Identical position result of incorrect, got: %t, want: %t.",
				actualResult, entry.expectedResult)
		}
	}
}
