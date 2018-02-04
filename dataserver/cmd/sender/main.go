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
	sendChan := make(chan lib.DataExport)
	go lib.SendToEndpoint(sendChan)

	lib.SendGlobalFeed(sendChan)

	scheduler := cron.New()
	scheduler.AddFunc("@every 5s", func() { lib.SendGlobalFeed(sendChan) })
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
