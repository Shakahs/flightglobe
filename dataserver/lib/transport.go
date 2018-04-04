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
			Timeout:   5 * time.Second,
			KeepAlive: 0,
		}).DialContext,
		DisableKeepAlives: true,
	},
}

func SendPositionSnapshot(outgoingData chan OutgoingSinglePositionDataset) {
	for {
		select {
		case export := <-outgoingData:
			jsonValue, _ := json.Marshal(export.data)
			resp, err := nChanClient.Post("http://localhost:8080/pub/"+export.channel, "application/json", bytes.NewBuffer(jsonValue))
			posCount := 0
			for range export.data {
				posCount += 1
			}
			if err == nil {
				resp.Body.Close()
			} else {
				fmt.Println(err)
			}
		}
	}
}

func SendFlightHistory(outgoingData chan OutgoingFlightHistory) {
	for {
		select {
		case export := <-outgoingData:
			jsonValue, _ := json.Marshal(export.data)
			resp, err := nChanClient.Post("http://localhost:8080/pub/"+export.channel, "application/json", bytes.NewBuffer(jsonValue))
			if err == nil {
				resp.Body.Close()
			} else {
				fmt.Println(err)
			}
		}
	}
}
