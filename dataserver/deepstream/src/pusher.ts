import { initConnection } from "./deepstream";
import { MasterFlightRecordFromRedis } from "./utility";
import { GeoPositionListCollector } from "./GeoPositionListCollector";
import {
   BootData,
   FlightDemographics,
   FlightDemographicsCollection,
   FlightPosition,
   MasterFlightRecord,
   RedisFlightRecord
} from "../../../lib/types";
import {
   DS_DEMOGRAPHICS_KEY,
   DS_GEOHASH_LIST_KEY,
   generateGeohashedPositionsKey,
   generateTrackFullKey
} from "../../../lib/constants";
import { Icao } from "../../../client-source/js/types";

const Redis = require("ioredis");

const redis = new Redis();

// export const dsRecordFromRedis = (
//    sourceRecords: RedisFlightRecord[]
// ): DeepstreamFlightRecord => {
//    const lastRecord = last(sourceRecords) as RedisFlightRecord;
//    const newRecord = {
//       icao: lastRecord.icao,
//       demographic: lastRecord.demographic,
//       latestPosition: lastRecord.position,
//       trackRecent: values(pick(takeRight(sourceRecords, 10), ["position"]))
//    };
//    return newRecord;
// };

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

         // keys.add(pos.icao);
         //
         // const record = ds.record.getRecord(pos.icao);
         // await record.whenReady();
         // if (deepEquals(record.get(), {})) {
         //    // new record
         //    ds.record.setData(pos.icao, pos);
         //    newCount++;
         // } else if (!deepEquals(record.get("Position"), pos.position)) {
         //    //update only position, only if it's changed
         //    record.set("latestPosition", pos.latestPosition);
         //    updateCount++;
         // }
         //
         // bootData[pos.icao] = {
         //    icao: pos.icao,
         //    positions: [pos.latestPosition],
         //    demographic: pos.demographic,
         //    time: pos.updated
         // };
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
