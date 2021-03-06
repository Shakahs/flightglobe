package flightradar24

import (
	"encoding/json"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/bitly/go-simplejson"
	"github.com/mmcloughlin/geohash"
	"log"
	"time"
)

func decode_raw(data []byte) []Fr_Record {
	var sData fr_raw
	err := json.Unmarshal(data, &sData)
	if err != nil {
		log.Fatal(err)
	}

	delete(sData, "full_count")
	delete(sData, "version")

	var collector []Fr_Record

	for _, v := range sData {
		var rec Fr_Record
		sj, err := simplejson.NewJson(v)
		if err != nil {
			log.Fatal(err)
		}
		rec.Icao = sj.GetIndex(0).MustString()
		rec.Lat = sj.GetIndex(1).MustFloat64()
		rec.Lng = sj.GetIndex(2).MustFloat64()
		rec.Heading = sj.GetIndex(3).MustFloat64()
		rec.Altitude = sj.GetIndex(4).MustInt()
		rec.Speed = sj.GetIndex(5).MustInt()
		rec.Squawk = sj.GetIndex(6).MustString()
		rec.Radar = sj.GetIndex(7).MustString()
		rec.Model = sj.GetIndex(8).MustString()
		rec.Registration = sj.GetIndex(9).MustString()
		rec.Time = sj.GetIndex(10).MustInt64()
		rec.Origin = sj.GetIndex(11).MustString()
		rec.Destination = sj.GetIndex(12).MustString()
		rec.Flight = sj.GetIndex(13).MustString()
		rec.OnGround = sj.GetIndex(14).MustBool()
		rec.RateOfClimb = sj.GetIndex(15).MustInt()
		rec.Callsign = sj.GetIndex(16).MustString()
		rec.IsGlider = sj.GetIndex(17).MustBool()
		collector = append(collector, rec)
		//fmt.Println(rec)
	}
	return collector
}

func transform(FrData []Fr_Record) pkg.FlightRecords {
	var collector pkg.FlightRecords
	for _, v := range FrData {
		pos := pkg.FlightRecord{
			Icao: v.Icao,
			Time: time.Unix(v.Time, 0).UTC(),
			Position: pkg.Position{
				Latitude:  v.Lat,
				Longitude: v.Lng,
				Timestamp: v.Time,
				Heading:   v.Heading,
				Altitude:  int32(v.Altitude),
				Geohash:   geohash.EncodeWithPrecision(v.Lat, v.Lng, 3),
			},
			Demographic: pkg.Demographic{
				Model:       v.Model,
				Origin:      v.Origin,
				Destination: v.Destination,
			},
		}
		collector = append(collector, pos)
	}
	return collector
}

func filter(data pkg.FlightRecords) pkg.FlightRecords {
	var collector pkg.FlightRecords
	for _, v := range data {
		//remove records with a blank icao
		if v.Icao != "" {
			collector = append(collector, v)
		}
	}
	return collector
}

func Clean(inChan chan []byte, outChan chan pkg.FlightRecords) {
	for {
		select {
		case raw := <-inChan:
			decoded := decode_raw(raw)
			transformed := transform(decoded)
			filtered := filter(transformed)
			outChan <- filtered
			//fmt.Println(len(ConvertedData), "records provided")
		}
	}
}
