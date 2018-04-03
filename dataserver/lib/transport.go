package lib

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"time"
)

var nChanClient = http.Client{
	Transport: &http.Transport{
		DialContext: (&net.Dialer{
			Timeout: 5 * time.Second,
			//KeepAlive: 0,
		}).DialContext,
		//DisableKeepAlives: true,
	},
}

func SendPositionSnapshot(outgoingData chan OutgoingSinglePositionDataset) {
	for {
		select {
		case export := <-outgoingData:
			go func(export OutgoingSinglePositionDataset) {
				jsonValue, _ := json.Marshal(export.data)
				resp, err := nChanClient.Post("http://localhost:8080/pub/"+export.channel, "application/json", bytes.NewBuffer(jsonValue))
				posCount := 0
				for range export.data {
					posCount += 1
				}
				fmt.Println("Sent", posCount, "positions for", len(export.data), "flights to endpoint", export.channel)
				if err == nil {
					defer resp.Body.Close()
				} else {
					fmt.Println(err)
				}
			}(export)
		}
	}
}

func SendFlightHistory(outgoingData chan OutgoingFlightHistory) {
	for {
		select {
		case export := <-outgoingData:
			go func(export OutgoingFlightHistory) {
				jsonValue, _ := json.Marshal(export.data)
				resp, err := nChanClient.Post("http://localhost:8080/pub/"+export.channel, "application/json", bytes.NewBuffer(jsonValue))
				fmt.Println("Sent", len(export.data), "positions to endpoint", export.channel)
				if err == nil {
					defer resp.Body.Close()
				} else {
					fmt.Println(err)
				}
			}(export)
		}
	}
}
