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
	for w := 1; w <= 4; w++ {
		go lib.SendToEndpoint()
		go lib.SendFlightHistoryWorker()
	}


	lib.SendAllPositions()
	//lib.FanoutSendFlightHistory()

	scheduler := cron.New()
	scheduler.AddFunc("@every 30s", func() { lib.SendAllPositions() })
	//scheduler.AddFunc("@every 30s", func() { lib.FanoutSendFlightHistory() })
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
