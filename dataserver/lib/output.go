package lib

import (
	"fmt"
	"time"
)

var globalFeedQuery = `SELECT distinct on (icao) icao, extract(epoch from ptime)::int as ptime, lat,lng,heading,altitude
FROM positions
where ptime  between  (CURRENT_TIMESTAMP - INTERVAL '1 minute') and CURRENT_TIMESTAMP
and icao != ''
order by icao;`

var flightHistoryQuery = `with T as (
SELECT DISTINCT ON (icao, aligned_measured_at) *,
(date_trunc('seconds', (ptime - TIMESTAMPTZ 'epoch') / 300) * 300 + TIMESTAMPTZ 'epoch') AS aligned_measured_at
FROM positions
WHERE ptime BETWEEN (CURRENT_TIMESTAMP - INTERVAL '18 hours') AND CURRENT_TIMESTAMP
AND icao = $1
ORDER BY icao, aligned_measured_at DESC
) SELECT id,icao,lat,lng,heading,altitude,ptime FROM T;`

var fetchHistoryJobs = make(chan Position)
var SendDataJobs = make(chan DataExport)

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func GetAllPositions() FlightHistory {
	var positions FlightHistory
	err := DB.Select(&positions, globalFeedQuery)
	if err != nil {
		fmt.Println(err)
	}
	return positions
}

func SendAllPositions() {
	positions := GetAllPositions()
	dpData := DecreasePrecisionOfDataset(positions, GlobalPrecision)
	positionMap := CreateMap(dpData)
	SendDataJobs <- DataExport{"global", positionMap}
}

func SendAllPositionsOverTime() {
	positions := GetAllPositions()
	dpData := DecreasePrecisionOfDataset(positions, GlobalPrecision)

	dLength := len(dpData)
	segmentSize := dLength / 29

	for i := 0; i < dLength; i += segmentSize + 1 {
		segment := positions[i:min(i+segmentSize, dLength)]
		positionMap := CreateMap(segment)
		SendDataJobs <- DataExport{"global", positionMap}
		time.Sleep(time.Second)
	}
}

func SendFlightHistoryWorker() {
	for {
		select {
		case j := <-fetchHistoryJobs:
			var positions FlightHistory
			err := DB.Select(&positions, flightHistoryQuery, j.Icao)
			if err != nil {
				fmt.Println(err)
			}
			dpData := DecreasePrecisionOfDataset(positions, GlobalPrecision)
			positionMap := CreateMap(dpData)
			SendDataJobs <- DataExport{j.Icao, positionMap}
		}
	}
}

func FanoutSendFlightHistory() {
	positions := GetAllPositions()
	for _, pos := range positions {
		fetchHistoryJobs <- pos
	}
}
