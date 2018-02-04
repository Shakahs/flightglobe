package lib

import "fmt"

var globalFeedQuery = `WITH T AS (
					SELECT *, ROW_NUMBER() OVER(PARTITION BY icao ORDER BY ptime DESC) AS rn
					FROM positions
					where ptime > (now()-'1 minutes'::INTERVAL)
				)
				SELECT id,icao,lat,lng,heading,altitude,ptime FROM T WHERE rn = 1;`

func SendGlobalFeed(outChan chan DataExport) {
	var positions FlightHistory
	err := DB.Select(&positions, globalFeedQuery)
	if err != nil {
		fmt.Println(err)
	}
	positionMap := CreateMap(positions)
	outChan <- DataExport{"global", positionMap}
	fmt.Println(positions)
}
