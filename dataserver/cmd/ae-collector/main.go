package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal"
	"github.com/Shakahs/flightglobe/dataserver/internal/adsbexchange"
	"os"
	"os/signal"
	"syscall"
)

func main() {

	rawData := make(chan []byte)
	go adsbexchange.Intake(rawData)

	cleanData := make(chan internal.Positions)
	go adsbexchange.Clean(rawData, cleanData)

	go internal.Persist(cleanData)

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
			return
		}
	}
}
