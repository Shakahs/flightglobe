package main

import (
	"encoding/json"
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis"
	"github.com/robfig/cron"
	"os"
)

var (
	redisAddress = os.Getenv("REDIS_ADDRESS")
	redisPort    = os.Getenv("REDIS_PORT")
	redisClient  *redis.Client
	dataset      = pkg.LockableCurrentData{}
)

func init() {
	pkg.CheckEnvVars(redisAddress, redisPort)
	redisClient = pkg.ProvideRedisClient(redisAddress, redisPort)
}

func refreshData() {
	x, y, z := pkg.GetCurrentData(redisClient)
	dataset.Lock.Lock()
	var err error

	dataset.DemographicsMap, err = json.Marshal(x)
	if err != nil {
		dataset.DemographicsMap = nil
	}

	//we need to convert the map[bool]string we have into an array of keys
	geohashKeys := make([]string, len(y))
	i := 0
	for k := range y {
		geohashKeys[i] = k
		i++
	}
	dataset.GeohashSet, err = json.Marshal(geohashKeys)
	if err != nil {
		dataset.DemographicsMap = nil
	}

	dataset.GeocollectedPositions, err = json.Marshal(z)
	if err != nil {
		dataset.GeocollectedPositions = nil
	}
	dataset.Lock.Unlock()
}

func getGeohashSet(c *gin.Context) {
	dataset.Lock.RLock()
	c.Data(200, "application/json", dataset.GeohashSet)
	dataset.Lock.RUnlock()

}

func getDemographicsMap(c *gin.Context) {
	dataset.Lock.RLock()
	c.Data(200, "application/json", dataset.DemographicsMap)
	dataset.Lock.RUnlock()
}

func getGeocollectedPositions(c *gin.Context) {
	dataset.Lock.RLock()
	c.Data(200, "application/json", dataset.GeocollectedPositions)
	dataset.Lock.RUnlock()
}

func getTrack(c *gin.Context) {
	icao := c.Param("icao")
	track, err := pkg.GetFullTrack(redisClient, fmt.Sprintf("track:%s", icao))
	if err == nil {
		c.JSON(200, track)
	} else {
		fmt.Println(err)
		c.JSON(400, gin.H{
			"error": "track not found, or an error occurred",
		})
	}
}

func main() {
	refreshData()
	c := cron.New()
	err := c.AddFunc("@every 5s", refreshData)
	pkg.Check(err)

	c.Start()

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	r.GET("/geohashset", getGeohashSet)
	r.GET("/demographicsmap", getDemographicsMap)
	r.GET("/geocollectedpositions", getGeocollectedPositions)
	r.GET("/track/:icao", getTrack)
	r.Run()
}
