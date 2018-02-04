package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/lib"
	"os"
	"os/signal"
	"syscall"
)

func main() {

	rawData := make(chan []byte)
	go lib.Intake(rawData)

	cleanData := make(chan lib.FlightHistory)
	go lib.Clean(rawData, cleanData)

	go lib.Persist(cleanData)

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
