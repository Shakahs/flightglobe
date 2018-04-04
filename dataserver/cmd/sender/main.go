package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/lib"
	"github.com/robfig/cron"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	outgoingPositionSnapshot := make(chan lib.OutgoingSinglePositionDataset, 100)
	outgoingFlightHistory := make(chan lib.OutgoingFlightHistory)

	go lib.SendPositionSnapshot(outgoingPositionSnapshot)
	for w := 1; w <= 10; w++ {
		go lib.SendFlightHistory(outgoingFlightHistory)
	}

	lib.CalculatePositionSnapshot(outgoingPositionSnapshot)
	lib.CalculateFlightHistories(outgoingFlightHistory)

	scheduler := cron.New()
	scheduler.AddFunc("@every 30s", func() { lib.CalculatePositionSnapshot(outgoingPositionSnapshot) })
	scheduler.AddFunc("@every 30s", func() { lib.CalculateFlightHistories(outgoingFlightHistory) })
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
