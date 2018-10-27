package redis_point_persistor

import (
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"testing"
)

func TestIsPositionValid(t *testing.T) {
	var testPos = pkg.Position{Icao:"abc"}
	if IsPositionValid(testPos) != true {
		t.Errorf("Valid position marked as invalid: %s", testPos.Icao)
	}

	testPos = pkg.Position{}
	if IsPositionValid(testPos) != false {
		t.Errorf("Invalid position marked as valid: %s", testPos.Icao)
	}
}