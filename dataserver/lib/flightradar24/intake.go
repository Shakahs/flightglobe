package flightradar24

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/lib"
	"github.com/Shakahs/flightglobe/dataserver/lib/quadtree"
	"github.com/paulmach/go.geo"
	"io/ioutil"
	"net/http"
)

func generateURL(qt *quadtree.Quadtree) string {
	b := qt.Bound()
	qtUrl := fmt.Sprintf(URL_TEMPLATE, b.North(), b.South(), b.West(), b.East())
	return qtUrl
}

func buildUrlList(qt *quadtree.Quadtree) []string {
	urlList := []string{}
	buildUrlList := func(qt *quadtree.Quadtree) {
		urlList = append(urlList, generateURL(qt))
	}
	quadtree.WalkQTLeafs(qt, buildUrlList)
	return urlList
}

func buildQuadTree(allPos lib.Positions) *quadtree.Quadtree {
	qt := quadtree.New(geo.NewBound(180, -180, -90, 90))
	for _, pos := range allPos {
		np := geo.NewPoint(pos.Lng, pos.Lat)
		qt.Insert(np)
	}
	//quadtree.PrintLeafMap(qt)
	return qt
}

func retrieve(url string) []byte {
	fmt.Println(url)
	resp, err := http.Get(url)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	return body
}

func Scrape(outputChan chan []byte) {
	//allPositions := lib.GetGlobalPositions()
	var allPositions lib.Positions //use nil value for now
	qt := buildQuadTree(allPositions) //should be empty quadtree with default bounds
	urlList := buildUrlList(qt) //should be 1 url
	for _,v := range urlList {
		data := retrieve(v)
		outputChan <- data
	}
}
