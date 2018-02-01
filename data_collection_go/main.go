package main

import (
	"fmt"
	"github.com/robfig/cron"
	"os"
	"os/signal"
	"syscall"
	"time"
	"sync"
)

type Position struct {
	Icao     string    `json:"icao,omitempty"`
	Lat      float64   `json:"lat"`
	Lng      float64   `json:"lon"`
	Time     time.Time `json:"time"`
	Heading  float64   `json:"heading"`
	Altitude float64   `json:"altitude"` // meters
}

type FlightHistory = []Position

type FlightDataSet map[string]FlightHistory

type LockableFlightDataSet = struct{
	sync.RWMutex
	flightData FlightDataSet
}

var AllFlights = LockableFlightDataSet{flightData: make(FlightDataSet)}

func main() {
	scheduler := cron.New()
	scheduler.AddFunc("@every 5s", func() { GetAdsbData() })
	scheduler.AddFunc("@every 10s", func() { SendGlobalFeed() })
	//scheduler.AddFunc("@every 10s", func() { SendLocalFeeds() })
	scheduler.Start()

	go sendToEndpoint()

	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc,
		syscall.SIGHUP,
		syscall.SIGINT,
		syscall.SIGTERM,
		syscall.SIGQUIT)

	for {
		select {
		case <-sigc:
			fmt.Println("Received signal, quitting")
			scheduler.Stop()
			return
		}
	}
}
