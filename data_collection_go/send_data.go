package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func SendAdsbData() {
	jsonValue, _ := json.Marshal(AllFlights)
	_, err := http.Post("http://localhost:8080/pub", "application/json", bytes.NewBuffer(jsonValue))
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Sent", len(AllFlights), "flights downstream")
}
