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

func UnmarshalPosition(rawPos string) (*Position, error) {
	var unmarshaledPos Position
	err := json.Unmarshal([]byte(rawPos), &unmarshaledPos) //get msg string, convert to byte array for unmarshal
	if err != nil {
		return &unmarshaledPos, err
	}
	return &unmarshaledPos, nil
}

func MarshalPosition(pos *Position) ([]byte, error) {
	marshaled, err := json.Marshal(pos)
	return marshaled, err
}
