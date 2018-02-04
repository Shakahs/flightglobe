package lib

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"time"
)

func SendToEndpoint(inChan chan DataExport) {
	var nChanClient = http.Client{
		Transport: &http.Transport{
			DialContext: (&net.Dialer{
				Timeout:   5 * time.Second,
				KeepAlive: 0,
			}).DialContext,
			DisableKeepAlives: true,
		},
	}
	for {
		select {
		case export := <-inChan:
			go func(export DataExport) {
				jsonValue, _ := json.Marshal(export.data)
				resp, err := nChanClient.Post("http://localhost:8080/pub/"+export.channel, "application/json", bytes.NewBuffer(jsonValue))
				fmt.Println("Sent data for", len(export.data), "flights to endpoint", export.channel)
				if err == nil {
					defer resp.Body.Close()
				} else {
					fmt.Println(err)
				}
			}(export)
		}
	}
}
