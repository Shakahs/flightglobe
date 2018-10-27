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
		actualResult := IsPositionValid(entry.pos)
		if actualResult != entry.expectedResult {
			t.Errorf("Validation result of %s incorrect, got: %t, want: %t.",
				entry.pos.Icao, actualResult, entry.expectedResult)
		}
	}
}
