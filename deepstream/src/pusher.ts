import { initConnection } from "./deepstream";
import { MasterFlightRecordFromRedis } from "./utility";
import { GeoPositionListCollector } from "./GeoPositionListCollector";
import {
   BootData,
   FlightDemographics,
   FlightDemographicsCollection,
   RedisFlightRecord
} from "../../lib/types";
import {
   DS_DEMOGRAPHICS_KEY,
   DS_GEOHASH_LIST_KEY,
   generateGeohashedPositionsKey
} from "../../lib/constants";
import { Icao } from "../../client-source/js/types";

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

   const keys = new Set<string>();
   const bootData: BootData = {};
   const geoCollector = new GeoPositionListCollector();
   const demographicsMap: FlightDemographicsCollection = {};

   stream.on("data", function(resultKeys: unknown[]) {
      // `resultKeys` is an array of strings representing key names.
      // Note that resultKeys may contain 0 keys, and that it will sometimes
      // contain duplicates due to SCAN's implementation in Redis.
      resultKeys.forEach(async (k) => {
         // count++;
         const rawData: string[] = await redis.lrange(k, 0, -1);
         const pos: RedisFlightRecord[] = rawData.map((i) => JSON.parse(i));
         const masterRecord = MasterFlightRecordFromRedis(pos);
         geoCollector.store(masterRecord);
         demographicsMap[masterRecord.icao] = masterRecord.demographic;
         count++;
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

      //set the geos first, otherwise the client may request them before they exist
      geoCollector.geocoll.forEach((geo) => {
         const dsGeo = ds.record.getRecord(
            generateGeohashedPositionsKey(geo.geohash)
         );
         dsGeo.set(geo);
      });

      const geohashList = ds.record.getList(DS_GEOHASH_LIST_KEY);
      await geohashList.whenReady();
      await geohashList.setEntriesWithAck(
         Array.from(geoCollector.geocoll.keys())
      );

      const demographicsRecord = ds.record.getRecord(DS_DEMOGRAPHICS_KEY);
      await demographicsRecord.whenReady();
      await demographicsRecord.setWithAck(demographicsMap);

      console.log(
         "done writing geohashlist, geohashed positions, and demographics"
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
