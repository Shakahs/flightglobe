package flightradar24

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg/quadtree"
	"github.com/paulmach/go.geo"
	"io/ioutil"
	"log"
	"net/http"
	"time"
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

func buildQuadTree(allFlightRecords []*pkg.FlightRecord) (*quadtree.Quadtree, int) {
	qt := quadtree.New(geo.NewBound(180, -180, -90, 90))
	qtMembers := 0
	for _, pos := range allFlightRecords {
		np := geo.NewPoint(pos.Position.Longitude, pos.Position.Latitude)
		qt.Insert(np)
		qtMembers++
	}
	//quadtree.PrintLeafMap(qt)
	//fmt.Println("Built quadtree with", qtMembers, "members")
	return qt, qtMembers
}

func Retrieve(url string) []byte {
	//fmt.Println(url)
	resp, err := http.Get(url)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	return body
}

func Scrape(pList []*pkg.FlightRecord, outputChan chan []byte) {
	qt, count := buildQuadTree(pList)
	urlList := buildUrlList(qt)
	delay := 29 / len(urlList)
	log.Printf("Retrieving %d URLs for %d flights with a delay of %d", len(urlList), count, delay)
	for _, v := range urlList {
		data := Retrieve(v)
		outputChan <- data
		time.Sleep(time.Duration(delay) * time.Second)
	}
}
