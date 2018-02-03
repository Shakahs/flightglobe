package main

import (
	"fmt"
	"github.com/robfig/cron"
	"github.com/Shakahs/flightglobe/dataserver"
	"os"
	"os/signal"
	"syscall"
)



func main() {
	scheduler := cron.New()
	scheduler.AddFunc("@every 5s", func() { dataserver.GetAdsbData() })
	scheduler.AddFunc("@every 10s", func() { dataserver.SendGlobalFeed() })
	//scheduler.AddFunc("@every 10s", func() { SendLocalFeeds() })
	scheduler.Start()

	go dataserver.SendToEndpoint()

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
