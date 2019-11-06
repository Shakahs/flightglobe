package pkg

import (
	"encoding/json"
)

func CheckEnvVars(vars ...string) {
	for _, v := range vars {
		if v == "" {
			panic("Required env variable not provided")
		}
	}
}

func UnmarshalPosition(rawPos string) (*FlightRecord, error) {
	var unmarshaledPos FlightRecord
	err := json.Unmarshal([]byte(rawPos), &unmarshaledPos) //get msg string, convert to byte array for unmarshal
	if err != nil {
		return &unmarshaledPos, err
	}
	return &unmarshaledPos, nil
}

func MarshalPosition(pos *FlightRecord) ([]byte, error) {
	marshaled, err := json.Marshal(pos)
	return marshaled, err
}

func Filter(data FlightRecords) FlightRecords {
	var collector FlightRecords
	for _, v := range data {
		//remove records with a blank icao
		if v.Icao != "" {
			collector = append(collector, v)
		}
	}
	return collector
}
