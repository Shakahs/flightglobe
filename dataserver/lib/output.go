package lib

import (
	"log"
	"time"
)

var globalQuery = `SELECT distinct on (icao) icao, extract(epoch from ptime)::int as ptime2, lat,lng,heading,altitude
FROM positions
where ptime  >=  (CURRENT_TIMESTAMP - INTERVAL '1 minute') 
and icao != '';`

var globalQueryWithPositions = `with T as (
SELECT DISTINCT ON (icao, ptime3) *,
(date_trunc('seconds', (ptime - TIMESTAMPTZ 'epoch') / 300) * 300 + TIMESTAMPTZ 'epoch') AS ptime3
FROM positions
WHERE ptime BETWEEN (CURRENT_TIMESTAMP - INTERVAL '18 hours') AND CURRENT_TIMESTAMP
AND icao = any($1)
ORDER BY icao, ptime3 ASC
) SELECT id,icao,lat,lng,heading,altitude,extract(epoch from ptime)::int as ptime2 FROM T;`

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

//func runQuery(query string) Positions {
//	var positions Positions
//	err := DB.Select(&positions, query)
//	if err != nil {
//		fmt.Println(err)
//	}
//	return positions
//}

//func GetGlobalPositions() Positions {
//	return runQuery(globalQuery)
//}

//func getGlobalPositionsWithHistory() Positions {
//	var positions Positions
//	rows, err := DB.Queryx(globalQueryWithPositions)
//	var wg sync.WaitGroup
//	for rows.Next() {
//		wg.Add(1)
//		go func() {
//			defer wg.Done()
//			var p Position
//			err = rows.StructScan(&p)
//			if err != nil {
//				fmt.Println(err)
//			}
//			positions = append(positions, p)
//		}()
//	}
//	wg.Wait()
//	fmt.Println("finished")
//	if err != nil {
//		fmt.Println(err)
//	}
//	return positions
//}

//func CalculatePositionSnapshot(outgoingData chan OutgoingSinglePositionDataset) {
//	positions := GetGlobalPositions()
//	dpData := DecreasePrecisionOfDataset(positions, GlobalPrecision)
//	go DeriveAllPositionsOverTime(dpData, outgoingData)
//	positionMap := CreateSinglePositionMap(dpData)
//	outgoingData <- OutgoingSinglePositionDataset{"globalSnapshot", positionMap}
//	log.Printf("Snapshot query sent live positions for %d flights", len(positions))
//}

func DeriveAllPositionsOverTime(positions Positions, outgoingData chan OutgoingSinglePositionDataset) {
	dLength := len(positions)
	segmentSize := dLength / 29

	for i := 0; i < dLength; i += segmentSize + 1 {
		segment := positions[i:min(i+segmentSize, dLength)]
		positionMap := CreateSinglePositionMap(segment)
		outgoingData <- OutgoingSinglePositionDataset{"globalStream", positionMap}
		log.Printf("Global stream sent live positions for %d flights", segmentSize)
		time.Sleep(time.Second)
	}
}

//func calculateHistoriesForIcaoRange(icaoRange []string, outgoingData chan OutgoingFlightHistory) {
//	start := time.Now()
//	arrayString := "{" + strings.Join(icaoRange[:], ",") + "}"
//	var positions Positions
//	err := DB.Select(&positions, globalQueryWithPositions, arrayString)
//	if err != nil {
//		fmt.Println(err)
//	}
//	thisFlightHistory := CreateMultiplePositionMap(positions)
//	for k, v := range thisFlightHistory {
//		individualFlightHistory := make(MultiplePositionDataset)
//		individualFlightHistory[k] = thisFlightHistory[k]
//		outgoingData <- OutgoingFlightHistory{channel: k, data: v}
//	}
//	end := time.Since(start)
//	log.Printf("History query sent %d positions for %d flights in %s", len(positions), len(thisFlightHistory), end)
//}

//func CalculateFlightHistories(outgoingData chan OutgoingFlightHistory) {
//	positions := GetGlobalPositions()
//	//split all ICAOs up into 10 buckets
//	const numBuckets = 8
//	idList := [numBuckets][]string{}
//	j := 0
//	segmentSize := len(positions) / numBuckets
//	for _, v := range positions {
//		if len(idList[j]) > (segmentSize) {
//			go calculateHistoriesForIcaoRange(idList[j], outgoingData)
//			j += 1
//		}
//		idList[j] = append(idList[j], v.Icao)
//	}
//	go calculateHistoriesForIcaoRange(idList[numBuckets-1], outgoingData)
//}
