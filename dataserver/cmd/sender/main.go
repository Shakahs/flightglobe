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
	outgoingSinglePositionDatasets := make(chan lib.OutgoingSinglePositionDataset, 100)
	outgoingFlightHistory := make(chan lib.OutgoingFlightHistory)

	for w := 1; w <= 5; w++ {
		go lib.ExportSinglePositionDataset(outgoingSinglePositionDatasets)
		go lib.ExportFlightHistory(outgoingFlightHistory)
	}

	//lib.SendAllPositions(outgoingSinglePositionDatasets)
	//lib.SendAllPositionsOverTime(outgoingSinglePositionDatasets)
	lib.SendFlightHistory(outgoingFlightHistory)

	scheduler := cron.New()
	//scheduler.AddFunc("@every 30s", func() { lib.SendAllPositions(outgoingSinglePositionDatasets) })
	//scheduler.AddFunc("@every 30s", func() { lib.SendAllPositionsOverTime(outgoingSinglePositionDatasets) })
	scheduler.AddFunc("@every 30s", func() { lib.SendFlightHistory(outgoingFlightHistory) })
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
