package main

import (
	"encoding/json"
	"fmt"
	"github.com/Shakahs/flightglobe/dataserver/internal/pkg"
	"github.com/gin-contrib/cors"
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
	pkg.WaitRedisConnected(redisClient)
}

func refreshData() {
	x, y, z := pkg.GetCurrentData(redisClient)
	dataset.Lock.Lock()
	defer dataset.Lock.Unlock()
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
}

func getGeohashSet(c *gin.Context) {
	dataset.Lock.RLock()
	defer dataset.Lock.RUnlock()
	c.Data(200, "application/json", dataset.GeohashSet)
}

func getDemographicsMap(c *gin.Context) {
	dataset.Lock.RLock()
	defer dataset.Lock.RUnlock()
	c.Data(200, "application/json", dataset.DemographicsMap)
}

func getGeocollectedPositions(c *gin.Context) {
	dataset.Lock.RLock()
	defer dataset.Lock.RUnlock()
	c.Data(200, "application/json", dataset.GeocollectedPositions)
}

func getTrack(c *gin.Context) {
	icao := c.Param("icao")
	track, err := pkg.GetFullTrack(redisClient, fmt.Sprintf("track:%s", icao))

	var positions []pkg.Position
	for _, v := range track {
		positions = append(positions, v.Position)
	}

	if err == nil {
		c.JSON(200, positions)
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
	r.Use(cors.Default())

	r.GET("/api/geohashset", getGeohashSet)
	r.GET("/api/demographicsmap", getDemographicsMap)
	r.GET("/api/geocollectedpositions", getGeocollectedPositions)
	r.GET("/api/track/:icao", getTrack)
	r.Run()
}
