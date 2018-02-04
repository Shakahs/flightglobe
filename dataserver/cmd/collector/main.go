package main

import (
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/scrape"
	"github.com/robfig/cron"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	scheduler := cron.New()
	scheduler.AddFunc("@every 5s", func() { scrape.GetAdsbData() })
	scheduler.AddFunc("@every 10s", func() { scrape.SendGlobalFeed() })
	//scheduler.AddFunc("@every 10s", func() { SendLocalFeeds() })
	scheduler.Start()

	go scrape.SendToEndpoint()

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
