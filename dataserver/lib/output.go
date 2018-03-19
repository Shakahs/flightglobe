package lib

import "fmt"

var globalFeedQuery = `SELECT distinct on (icao) *
FROM positions
where ptime  between  (CURRENT_TIMESTAMP - INTERVAL '1 minute') and CURRENT_TIMESTAMP
order by icao,ptime desc;`

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
