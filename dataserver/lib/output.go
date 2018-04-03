package lib

import (
	"fmt"
	"sync"
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
ORDER BY ptime ASC LIMIT 100;`

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
	var positions Positions
	rows, err := DB.Queryx(globalQueryWithPositions)
	var wg sync.WaitGroup
	for rows.Next() {
		wg.Add(1)
		go func() {
			defer wg.Done()
			var p Position
			err = rows.StructScan(&p)
			if err != nil {
				fmt.Println(err)
			}
			positions = append(positions, p)
		}()
	}
	wg.Wait()
	fmt.Println("finished")
	if err != nil {
		fmt.Println(err)
	}
	return positions
}

func CalculatePositionSnapshot(outgoingData chan OutgoingSinglePositionDataset) {
	positions := GetGlobalPositions()
	dpData := DecreasePrecisionOfDataset(positions, GlobalPrecision)
	go DeriveAllPositionsOverTime(dpData, outgoingData)
	positionMap := CreateSinglePositionMap(dpData)
	outgoingData <- OutgoingSinglePositionDataset{"globalSnapshot", positionMap}
}

func DeriveAllPositionsOverTime(positions Positions, outgoingData chan OutgoingSinglePositionDataset) {
	dLength := len(positions)
	segmentSize := dLength / 29

	for i := 0; i < dLength; i += segmentSize + 1 {
		segment := positions[i:min(i+segmentSize, dLength)]
		positionMap := CreateSinglePositionMap(segment)
		outgoingData <- OutgoingSinglePositionDataset{"globalStream", positionMap}
		time.Sleep(time.Second)
	}
}

func CalculateFlightHistories(outgoingData chan OutgoingFlightHistory) {
	positions := getGlobalPositionsWithHistory()
	//dpData := DecreasePrecisionOfDataset(positions, GlobalPrecision)
	allFlightHistory := CreateMultiplePositionMap(positions)
	for k, v := range allFlightHistory {
		individualFlightHistory := make(MultiplePositionDataset)
		individualFlightHistory[k] = allFlightHistory[k]
		outgoingData <- OutgoingFlightHistory{channel: k, data: v}
	}
}
