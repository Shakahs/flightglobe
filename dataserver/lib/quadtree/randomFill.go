package quadtree

import (
	"fmt"
	"github.com/paulmach/go.geo"
	"github.com/paulmach/go.geojson"
	"math/rand"
	"time"
)

var nums = []float64{-1, 1}

func randNeg() float64 {

	c := nums[rand.Intn(len(nums))]
	return c
}

func randX() float64 {
	return float64(rand.Int31n(180)) * randNeg()
}

func randY() float64 {
	return float64(rand.Int31n(90)) * randNeg()
}

func RandomFill(qt *Quadtree) {
	rand.Seed(time.Now().UnixNano())

	for i := 0; i < 1000; i++ {
		np := geo.NewPoint(randX(), randY())
		fmt.Println(np.Lat(), np.Lng())
		qt.Insert(np)
	}
}

func PrintLeafMap(qt *Quadtree) {
	var fc = geojson.NewFeatureCollection()

	handleFeature := func(qt *Quadtree) {
		pg := geojson.NewPolygonFeature([][][]float64{
			{{qt.Bound().SouthWest().Lng(), qt.Bound().SouthWest().Lat()},
				{qt.Bound().SouthEast().Lng(), qt.Bound().SouthEast().Lat()},
				{qt.Bound().NorthEast().Lng(), qt.Bound().NorthEast().Lat()},
				{qt.Bound().NorthWest().Lng(), qt.Bound().NorthWest().Lat()},
				{qt.Bound().SouthWest().Lng(), qt.Bound().SouthWest().Lat()},
			}})
		pg.Properties["count"]=len(qt.Points)
		fc.AddFeature(pg)
	}

	WalkQTLeafs(qt, handleFeature)
	rawJSON, _ := fc.MarshalJSON()
	fmt.Println(string(rawJSON))
}
