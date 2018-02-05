package lib

import "fmt"

var globalFeedQuery =
`SELECT distinct on (icao) *
FROM positions
where ptime  between  (CURRENT_TIMESTAMP - INTERVAL '1 minute') and CURRENT_TIMESTAMP
order by icao,ptime desc;`

func SendGlobalFeed(outChan chan DataExport) {
	var positions FlightHistory
	err := DB.Select(&positions, globalFeedQuery)
	if err != nil {
		fmt.Println(err)
	}
	dpData := DecreasePrecisionOfDataset(positions, GlobalPrecision)
	positionMap := CreateMap(dpData)
	outChan <- DataExport{"global", positionMap}
}
