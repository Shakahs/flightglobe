package flightradar24

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg/quadtree"
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
		if len(qt.Points) > 1000 {
			fmt.Println("Found quadtree with", len(qt.Points), "children")
		}
	}
	quadtree.WalkQTLeafs(qt, buildUrlList)
	return urlList
}

func buildQuadTree(allPos []*pkg.Position) *quadtree.Quadtree {
	qt := quadtree.New(geo.NewBound(180, -180, -90, 90))
	qtMembers := 0
	for _, pos := range allPos {
		np := geo.NewPoint(pos.Longitude, pos.Latitude)
		qt.Insert(np)
		qtMembers++
	}
	//quadtree.PrintLeafMap(qt)
	//fmt.Println("Built quadtree with", qtMembers, "members")
	return qt
}

func retrieve(url string) []byte {
	//fmt.Println(url)
	resp, err := http.Get(url)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	return body
}

func Scrape(pList []*pkg.Position, outputChan chan []byte) {
	qt := buildQuadTree(pList)
	urlList := buildUrlList(qt)
	for _, v := range urlList {
		data := retrieve(v)
		outputChan <- data
	}
}
