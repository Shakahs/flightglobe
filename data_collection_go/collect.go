package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/asaskevich/govalidator"
	"io/ioutil"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

type adsb_record struct { //altitude is in feet
	Id           string `json:"Icao"`
	Lat          float64
	Lng          float64 `json:"Long"`
	Timestamp    int64   `json:"PosTime"` //timestamp with nanosecond
	Time         time.Time
	Heading      float32 `json:"Trak"`
	AltitudeFeet float32 `json:"Galt"`
	Altitude     float32 // meters
}

type adsb_list = []adsb_record

type adsb_feed struct {
	AcList adsb_list
}

func getRawAdsbData() adsb_list {
	resp, err := http.Get("http://public-api.adsbexchange.com/VirtualRadar/AircraftList.json")
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	var unmarshaledData adsb_feed
	bodyBytes, err := ioutil.ReadAll(resp.Body)
	err = json.Unmarshal(bodyBytes, &unmarshaledData)

	if err != nil {
		fmt.Println(err)
	}
	return unmarshaledData.AcList
}

func convertAdsbData(record *adsb_record) {
	//convert timestamp to native time type
	timeStringWithNano := strconv.FormatInt(record.Timestamp, 10)
	timeStringUnix := timeStringWithNano[0 : len(timeStringWithNano)-3]
	timeStampUnix, _ := strconv.ParseInt(timeStringUnix, 10, 32)
	record.Time = time.Unix(timeStampUnix, 0)

	//convert feet to meters
	record.Altitude = record.AltitudeFeet / 3.2808399
}

func validateAdsbData(record adsb_record) bool {
	validatorA := govalidator.IsAlphanumeric(record.Id) && //Icao id
		govalidator.IsByteLength(record.Id, 3, 10) &&
		// latitude
		govalidator.IsLatitude(strconv.FormatFloat(record.Lat, 'f', -1, 64)) &&
		// longitude
		govalidator.IsLongitude(strconv.FormatFloat(record.Lng, 'f', -1, 64)) &&
		// heading
		govalidator.InRangeFloat32(record.Heading, 0, 360) &&
		// altitude
		govalidator.InRangeFloat32(record.Altitude, -500, 30000)

	validatorB := record.Lat != 0 || record.Lng != 0

	return validatorA && validatorB
}

func getAdsbData() []adsb_record {
	rawFlightData := getRawAdsbData()
	var processedData []adsb_record

	for _, val := range rawFlightData {
		if validateAdsbData(val) {
			convertAdsbData(&val)
			processedData = append(processedData, val)
		}
	}

	return processedData
}

func sendAdsbData() {
	flight_data := getAdsbData()
	jsonValue, _ := json.Marshal(flight_data)
	_, err := http.Post("http://localhost:8080/pub", "application/json", bytes.NewBuffer(jsonValue))
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Sent", len(flight_data), "flights")
}

func main() {
	ticker := time.NewTicker(5 * time.Second)
	quit := make(chan struct{})

	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc,
		syscall.SIGHUP,
		syscall.SIGINT,
		syscall.SIGTERM,
		syscall.SIGQUIT)
	go func() {
		for {
			select {
			case <-sigc:
				fmt.Println("Received signal, quitting")
				close(quit)
			}
		}
	}()

	sendAdsbData()

	for {
		select {
		case <-ticker.C:
			sendAdsbData()
		case <-quit:
			ticker.Stop()
			return
		}
	}
}
