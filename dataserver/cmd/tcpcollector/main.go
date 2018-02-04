package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/datastreamer"
	"github.com/Shakahs/flightglobe/dataserver/types"
	"os"
	"os/signal"
	"syscall"
)

func main() {

	rawData := make(chan []byte)
	go datastreamer.Stream(rawData)

	cleanData := make(chan types.FlightHistory)
	go datastreamer.Clean(rawData, cleanData)

	go datastreamer.Persist(cleanData)

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
		case r := <-cleanData:
			fmt.Println(len(r))
		}
	}
}
