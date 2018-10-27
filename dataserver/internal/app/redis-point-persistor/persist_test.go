package redis_point_persistor

import (
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"testing"
)

func TestIsPositionValid(t *testing.T) {

	testTable := []struct {
		pos            pkg.Position
		expectedResult bool
	}{
		{pos: pkg.Position{Icao: "abc"}, expectedResult: true},
		{pos: pkg.Position{}, expectedResult: false},
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
		oldPos         pkg.Position
		newPos         pkg.Position
		expectedResult bool
	}{
		{
			oldPos:         pkg.Position{Latitude: 99, Longitude: 99},
			newPos:         pkg.Position{Latitude: 99, Longitude: 99},
			expectedResult: true,
		},
		{
			oldPos:         pkg.Position{Latitude: 99, Longitude: 99},
			newPos:         pkg.Position{Latitude: 98, Longitude: 99},
			expectedResult: false,
		},
		{
			oldPos:         pkg.Position{Latitude: 99, Longitude: 99},
			newPos:         pkg.Position{Latitude: 99, Longitude: 98},
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
