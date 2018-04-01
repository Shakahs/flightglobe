package lib

import (
	"fmt"
	"time"
)

var globalQuery = `SELECT distinct on (icao) icao, extract(epoch from ptime)::int as ptime2, lat,lng,heading,altitude
FROM positions
where ptime  >=  (CURRENT_TIMESTAMP - INTERVAL '1 minute') 
and icao != '';`

var globalQueryWithPositions = `SELECT id,icao,lat,lng,heading,altitude,extract(epoch from ptime)::int as ptime2
FROM positions
WHERE ptime >= (CURRENT_TIMESTAMP - INTERVAL '18 hours')
AND icao != ''
ORDER BY ptime ASC;`

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func runQuery(query string) Positions {
	var positions Positions
	err := DB.Select(&positions, query)
	if err != nil {
		fmt.Println(err)
	}
	return positions
}

func GetGlobalPositions() Positions {
	return runQuery(globalQuery)
}

func getGlobalPositionsWithHistory() Positions {
	return runQuery(globalQueryWithPositions)
}

func SendAllPositions(outgoingData chan OutgoingSinglePositionDataset) {
	positions := GetGlobalPositions()
	dpData := DecreasePrecisionOfDataset(positions, GlobalPrecision)
	positionMap := CreateSinglePositionMap(dpData)
	outgoingData <- OutgoingSinglePositionDataset{"globalSnapshot", positionMap}
}

func SendAllPositionsOverTime(outgoingData chan OutgoingSinglePositionDataset) {
	positions := GetGlobalPositions()
	dpData := DecreasePrecisionOfDataset(positions, GlobalPrecision)

	dLength := len(dpData)
	segmentSize := dLength / 29

	for i := 0; i < dLength; i += segmentSize + 1 {
		segment := positions[i:min(i+segmentSize, dLength)]
		positionMap := CreateSinglePositionMap(segment)
		outgoingData <- OutgoingSinglePositionDataset{"globalStream", positionMap}
		time.Sleep(time.Second)
	}
}

func SendFlightHistory(outgoingData chan OutgoingFlightHistory) {
	positions := getGlobalPositionsWithHistory()
	//dpData := DecreasePrecisionOfDataset(positions, GlobalPrecision)
	allFlightHistory := CreateMultiplePositionMap(positions)
	for k, v := range allFlightHistory {
		individualFlightHistory := make(MultiplePositionDataset)
		individualFlightHistory[k] = allFlightHistory[k]
		outgoingData <- OutgoingFlightHistory{channel: k, data: v}
	}
}
