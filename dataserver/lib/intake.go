package lib

import (
	"bytes"
	"fmt"
	"net"
	"time"
)

func readStream(conn net.Conn, outputChan chan []byte) {
	collector := []byte{}
	for {
		b := make([]byte, 1024*128)
		n, err := conn.Read(b)
		if err != nil {
			fmt.Println(err)
			return
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

func Intake(outputChan chan []byte) {
	for {
		conn, err := net.Dial("tcp", "pub-vrs.adsbexchange.com:32005")
		if err != nil {
			fmt.Println("dial error:", err)
			return
		}
		fmt.Println("Connection opened")
		readStream(conn, outputChan)
		//todo: exponential backoff
		time.Sleep(5 * time.Second)
	}
}
