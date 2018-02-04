package datastreamer

import (
	"bytes"
	"fmt"
	"net"
)

func Stream(outputChan chan []byte) {
	conn, err := net.Dial("tcp", "pub-vrs.adsbexchange.com:32001")
	if err != nil {
		fmt.Println("dial error:", err)
		return
	}
	fmt.Println("Connection opened")

	collector := []byte{}
	for {
		b := make([]byte, 1024*128)
		n, err := conn.Read(b)
		if err != nil {
			fmt.Println(err)
		}

		for _, onebyte := range b[:n] {
			collector = append(collector, onebyte)
		}

		seperatorPos := bytes.Index(collector, []byte("}{"))
		if seperatorPos >= 0 {
			newData := collector[:seperatorPos+1]
			collector = collector[seperatorPos+1:]
			outputChan <- newData
		}
	}

}
