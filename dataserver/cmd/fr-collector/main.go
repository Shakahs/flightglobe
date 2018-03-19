package main

import (
	"github.com/Shakahs/flightglobe/dataserver/lib/quadtree"
	"github.com/paulmach/go.geo"
)

func main() {
	qt := quadtree.New(geo.NewBound(180, -180, -90, 90))
	quadtree.RandomFill(qt)
	quadtree.PrintLeafMap(qt)
}
