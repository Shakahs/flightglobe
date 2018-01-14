package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/asaskevich/govalidator"
	"github.com/robfig/cron"
	"io/ioutil"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

type flight_record struct { //altitude is in feet
	Id       string    `json:"id"`
	Lat      float64   `json:"lat"`
	Lng      float64   `json:"lon"`
	Time     time.Time `json:"time"`
	Heading  float32   `json:"heading"`
	Altitude float32   `json:"altitude"` // meters
}

type flight_list = []flight_record

type adsb_record struct { //altitude is in feet
	Icao    string
	Lat     float64
	Long    float64
	PosTime int64 //timestamp with nanosecond
	Trak    float32
	Galt    float32 //altitude in feet
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

func convertAdsbData(record *adsb_record) (flight_record, error) {
	var flight flight_record

	//copy values
	flight.Id = record.Icao
	flight.Lat = record.Lat
	flight.Lng = record.Long
	flight.Heading = record.Trak

	//convert timestamp to native time type
	if record.PosTime == 0 {
		return flight, errors.New("Invalid time")
	}
	timeStringWithNano := strconv.FormatInt(record.PosTime, 10)
	timeStringUnix := timeStringWithNano[0 : len(timeStringWithNano)-3]
	timeStampUnix, _ := strconv.ParseInt(timeStringUnix, 10, 32)
	flight.Time = time.Unix(timeStampUnix, 0)

	//convert feet to meters
	flight.Altitude = record.Galt / 3.2808399
	return flight, nil
}

func validateFlightData(record flight_record) bool {
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

func getAdsbData() flight_list {
	rawFlightData := getRawAdsbData()
	var processedData []flight_record

	for _, val := range rawFlightData {
		convertedRecord, err := convertAdsbData(&val)
		if err == nil && validateFlightData(convertedRecord) {
			processedData = append(processedData, convertedRecord)
		}
	}

	return processedData
}

func sendAdsbData() {
	all_flights = getAdsbData()
	jsonValue, _ := json.Marshal(all_flights)
	_, err := http.Post("http://localhost:8080/pub", "application/json", bytes.NewBuffer(jsonValue))
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Sent", len(all_flights), "flights")
}

var all_flights flight_list

func main() {
	scheduler := cron.New()
	scheduler.AddFunc("@every 10s", func() { sendAdsbData() })
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
