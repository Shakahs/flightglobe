package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/lib/quadtree"
	"github.com/paulmach/go.geo"
	"github.com/paulmach/go.geojson"
	"math/rand"
	"time"
)

const MaxPoints = 10

var fc = geojson.NewFeatureCollection()

func recurseQT(qt quadtree.Quadtree) {
	if qt.HasChildren {
		for _, v := range qt.Children {
			if v != nil {
				recurseQT(*v)
			}
		}
	} else {
		//fmt.Println(qt.Bound().SouthWest().Lat(), ",", qt.Bound().SouthWest().Lng())
		//fmt.Println(qt.Bound().NorthEast().ToArray(), ",", qt.Bound().NorthEast().Lng())

		pg := geojson.NewPolygonFeature([][][]float64{
			{{qt.Bound().SouthWest().Lng(), qt.Bound().SouthWest().Lat()},
				{qt.Bound().SouthEast().Lng(), qt.Bound().SouthEast().Lat()},
				{qt.Bound().NorthEast().Lng(), qt.Bound().NorthEast().Lat()},
				{qt.Bound().NorthWest().Lng(), qt.Bound().NorthWest().Lat()},
				{qt.Bound().SouthWest().Lng(), qt.Bound().SouthWest().Lat()},
			}})

		fc.AddFeature(pg)
	}
}

func randNeg() float64 {
	rand.Seed(time.Now().UnixNano())
	nums := []float64{-1, 1}
	c := nums[rand.Intn(len(nums))]
	return c
}

func randX() float64 {
	return float64(rand.Int31n(180)) * randNeg()
}

func randY() float64 {
	return float64(rand.Int31n(90)) * randNeg()
}

func main() {
	qt := quadtree.New(geo.NewBound(180, -180, -90, 90))

	// insert 1000 random points
	for i := 0; i < 3000; i++ {
		np := geo.NewPoint(randX(), randY())
		fmt.Println(np.Lat(), np.Lng())
		qt.Insert(np)
	}
	recurseQT(*qt)

	rawJSON, _ := fc.MarshalJSON()
	fmt.Println(string(rawJSON))

}