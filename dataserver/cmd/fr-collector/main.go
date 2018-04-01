package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/lib"
	"github.com/Shakahs/flightglobe/dataserver/lib/flightradar24"
	"github.com/robfig/cron"
	"os"
	"os/signal"
	"syscall"
)

func main() {

	rawData := make(chan []byte)
	go flightradar24.Scrape(rawData)

	cleanData := make(chan lib.Positions)
	go flightradar24.Clean(rawData, cleanData)

	go lib.Persist(cleanData)

	scheduler := cron.New()
	scheduler.AddFunc("@every 30s", func() { flightradar24.Scrape(rawData) })
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
