// import "regenerator-runtime/runtime";
import { initConnection } from "./deepstream";
import { MasterFlightRecordFromRedis } from "./utility";
import { GeoPositionListCollector } from "./GeoPositionListCollector";
import {
   FlightDemographicsCollection,
   Icao,
   MasterFlightRecord,
   RedisFlightRecord
} from "../../../lib/types";
import {
   DS_DEMOGRAPHICS_KEY,
   DS_GEOHASH_LIST_KEY,
   generateGeohashedPositionsKey,
   generateTrackFullKey
} from "../../../lib/constants";

const Redis = require("ioredis");

console.log("deepstream pusher starting");

const redis = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);

const work = (ds) => {
   let count = 0;

   const stream = redis.scanStream({
      match: "track:*",
      count: 100
   });

   const geoCollector = new GeoPositionListCollector();
   const demographicsMap: FlightDemographicsCollection = {};
   const masterRecordMap = new Map<Icao, MasterFlightRecord>();

   stream.on("data", function(resultKeys: unknown[]) {
      // `resultKeys` is an array of strings representing key names.
      // Note that resultKeys may contain 0 keys, and that it will sometimes
      // contain duplicates due to SCAN's implementation in Redis.
      resultKeys.forEach(async (k) => {
         // count++;
         let rawData: string[] = [];
         try {
            rawData = await redis.lrange(k, 0, -1);
         } catch {
            console.log("retrieving track from redis failed");
         }
         if (rawData.length >= 1) {
            const pos: RedisFlightRecord[] = rawData.map((i) => JSON.parse(i));
            const masterRecord = MasterFlightRecordFromRedis(pos);
            masterRecordMap.set(masterRecord.icao, masterRecord);
            geoCollector.store(masterRecord);
            demographicsMap[masterRecord.icao] = masterRecord.demographic;
            count++;
         }
      });
   });

   stream.on("end", async function() {
      console.log(
         `looped over ${count} points, ${geoCollector.geocoll.size} geocollections created`
      );

      //write the geohashed current positions first, otherwise the client may request them before they exist
      geoCollector.geocoll.forEach((geo) => {
         const dsGeo = ds.record.getRecord(
            generateGeohashedPositionsKey(geo.geohash)
         );
         dsGeo.set(geo);
      });

      masterRecordMap.forEach((mr) => {
         const dsTrackFull = ds.record.getRecord(generateTrackFullKey(mr.icao));
         dsTrackFull.set(mr.trackFull);
      });

      //write geohash list
      const geohashList = ds.record.getList(DS_GEOHASH_LIST_KEY);
      await geohashList.whenReady();
      await geohashList.setEntriesWithAck(
         Array.from(geoCollector.geocoll.keys())
      );

      //write demographics
      const demographicsRecord = ds.record.getRecord(DS_DEMOGRAPHICS_KEY);
      await demographicsRecord.whenReady();
      await demographicsRecord.setWithAck(demographicsMap);

      console.log(
         "done writing geohashlist, geohashed positions, full tracks, and demographics"
      );
   });
};

if (require.main === module) {
   initConnection().then((ds) => {
      const loop = () => {
         work(ds);
      };
      loop();
      setInterval(loop, 10 * 1000);
   });
}
