package main

import (
	"fmt"
	"github.com/robfig/cron"
	"os"
	"os/signal"
	"syscall"
	"time"
)

type FlightRecord struct { //altitude is in feet
	Id       string    `json:"id"`
	Lat      float64   `json:"lat"`
	Lng      float64   `json:"lon"`
	Time     time.Time `json:"time"`
	Heading  float64   `json:"heading"`
	Altitude float64   `json:"altitude"` // meters
}

type FlightList = []FlightRecord

var AllFlights FlightList

func main() {
	scheduler := cron.New()
	scheduler.AddFunc("@every 5s", func() { GetAdsbData() })
	scheduler.AddFunc("@every 10s", func() { SendGlobalFeed() })
	scheduler.AddFunc("@every 10s", func() { SendLocalFeeds() })
	scheduler.Start()

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
