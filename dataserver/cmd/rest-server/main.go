package main

import (
	"encoding/json"
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
	dataset.DemographicsMap = x
	dataset.GeohashSet = y
	dataset.GeocollectedPositions = z
	dataset.Lock.Unlock()
}

func getGeohashSet(c *gin.Context) {
	dataset.Lock.RLock()
	//we need to convert the map[bool]string we have into an array of keys
	keys := make([]string, len(dataset.GeohashSet))
	i := 0
	for k := range dataset.GeohashSet {
		keys[i] = k
		i++
	}
	dataset.Lock.RUnlock()
	c.JSON(200, dataset.GeohashSet)
}

func getDemographicsMap(c *gin.Context) {
	dataset.Lock.RLock()
	data, err := json.Marshal(dataset.DemographicsMap)
	dataset.Lock.RUnlock()
	if err == nil {
		c.Data(200, "application/json", data)
	} else {
		c.JSON(500, gin.H{
			"message": "an error occurred",
		})
	}
}

func main() {
	refreshData()
	c := cron.New()
	err := c.AddFunc("@every 5s", refreshData)
	pkg.Check(err)

	c.Start()

	r := gin.Default()
	r.GET("/geohashset", getGeohashSet)
	r.GET("/demographicsmap", getDemographicsMap)
	r.Run()
}
