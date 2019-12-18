// import "regenerator-runtime/runtime";
import { initConnection } from "./deepstream";
import { extractLastPositions, MasterFlightRecordFromRedis } from "./utility";
import { GeoPositionListCollector } from "./GeoPositionListCollector";
import {
   FlightDemographicsCollection,
   FlightPosition,
   GeoPositionList,
   GeoPositionListCollection,
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
import { last, each, size } from "lodash";

const Redis = require("ioredis");

console.log("deepstream pusher starting");

const redis = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);

const gatherKeys = (): Promise<Set<string>> =>
   new Promise((resolve, reject) => {
      const foundKeys: Set<string> = new Set();

      const stream = redis.scanStream({
         match: "track:*",
         count: 100
      });

      stream.on("data", function(resultKeys: string[]) {
         resultKeys.forEach((k) => {
            foundKeys.add(k);
         });
      });

      stream.on("end", () => {
         resolve(foundKeys);
      });

      stream.on("error", (err) => {
         reject(err);
      });
   });

const processTrack = (
   ds,
   key: string,
   demographicsMap: FlightDemographicsCollection,
   allGeohashes: Set<string>,
   geoCollector: GeoPositionListCollector
) => {
   let rawFullTrack: string[] = [];
   try {
      // rawFullTrack = await redis.lrange(key, 0, -1);
   } catch (e) {
      console.log("a redis error ocurred when retrieving:", key);
      // return;
   }

   try {
      const fullTrack = rawFullTrack.map<RedisFlightRecord>((i) =>
         JSON.parse(i)
      );
      const lastTrackPosition = last(fullTrack);
      if (lastTrackPosition) {
         const shortenedGeohash = lastTrackPosition.position.geohash[0];
         demographicsMap[lastTrackPosition.icao] =
            lastTrackPosition.demographic;
         allGeohashes.add(shortenedGeohash);
         //write the full track
         const dsTrackFull = ds.record.getRecord(
            generateTrackFullKey(lastTrackPosition.icao)
         );
         // await dsTrackFull.whenReady();
         dsTrackFull.set(extractLastPositions(fullTrack));
         // dsTrackFull.discard();
         geoCollector.store(
            shortenedGeohash,
            lastTrackPosition.icao,
            lastTrackPosition.position
         );
      }
   } catch (e) {
      console.log("error during track processing:", e);
   }

   return;
};

const work2 = async (ds) => {
   let trackKeys: Set<string> | null = null;
   const demographicsMap: FlightDemographicsCollection = {};
   const allGeohashes = new Set<string>();
   const geoCollector = new GeoPositionListCollector();

   try {
      trackKeys = await gatherKeys();
   } catch (e) {
      console.log("error during key scan:", e);
      return;
   }

   console.log("found track keys:", trackKeys.size);

   for (const eachKey of trackKeys) {
      processTrack(ds, eachKey, demographicsMap, allGeohashes, geoCollector);
   }

   //write geohashed positions
   const promises: Array<(x: GeoPositionList) => Promise<void>> = [];
   geoCollector.geocoll.forEach((geo) => {
      promises.push(async (geo) => {
         const dsGeo = ds.record.getRecord(
            generateGeohashedPositionsKey(geo.geohash)
         );
         await dsGeo.whenReady();
         dsGeo.setWithAck(geo);
         dsGeo.discard();
      });
   });
   await Promise.all(promises);
   console.log("geohashed position groups written:", geoCollector.geocoll.size);

   //write geohash list
   const geohashList = ds.record.getList(DS_GEOHASH_LIST_KEY);
   await geohashList.whenReady();
   await geohashList.setEntriesWithAck(Array.from(allGeohashes));
   geohashList.discard();
   console.log("geohash list written with size:", allGeohashes.size);

   //write demographics
   const demographicsRecord = ds.record.getRecord(DS_DEMOGRAPHICS_KEY);
   await demographicsRecord.whenReady();
   await demographicsRecord.setWithAck(demographicsMap);
   demographicsRecord.discard();
   console.log("demographics written with size:", size(demographicsMap));
};

// const work = (ds) => {
//    let count = 0;
//
//    const stream = redis.scanStream({
//       match: "track:*",
//       count: 100
//    });
//
//    const geoCollector = new GeoPositionListCollector();
//    const demographicsMap: FlightDemographicsCollection = {};
//    const masterRecordMap = new Map<Icao, MasterFlightRecord>();
//
//    stream.on("data", function(resultKeys: unknown[]) {
//       // `resultKeys` is an array of strings representing key names.
//       // Note that resultKeys may contain 0 keys, and that it will sometimes
//       // contain duplicates due to SCAN's implementation in Redis.
//       resultKeys.forEach(async (k) => {
//          // count++;
//          let rawData: string[] = [];
//          try {
//             rawData = await redis.lrange(k, 0, -1);
//          } catch {
//             console.log("retrieving track from redis failed");
//          }
//          if (rawData.length >= 1) {
//             const pos: RedisFlightRecord[] = rawData.map((i) => JSON.parse(i));
//             const masterRecord = MasterFlightRecordFromRedis(pos);
//             masterRecordMap.set(masterRecord.icao, masterRecord);
//             geoCollector.store(masterRecord);
//             demographicsMap[masterRecord.icao] = masterRecord.demographic;
//             count++;
//          }
//       });
//    });
//
//    stream.on("end", async function() {
//       console.log(
//          `looped over ${count} points, ${geoCollector.geocoll.size} geocollections created`
//       );
//
//       //write the geohashed current positions first, otherwise the client may request them before they exist
//       geoCollector.geocoll.forEach((geo) => {
//          const dsGeo = ds.record.getRecord(
//             generateGeohashedPositionsKey(geo.geohash)
//          );
//          dsGeo.set(geo);
//       });
//
//       masterRecordMap.forEach((mr) => {
//          const dsTrackFull = ds.record.getRecord(generateTrackFullKey(mr.icao));
//          dsTrackFull.set(mr.trackFull);
//       });
//
//       //write geohash list
//       const geohashList = ds.record.getList(DS_GEOHASH_LIST_KEY);
//       await geohashList.whenReady();
//       await geohashList.setEntriesWithAck(
//          Array.from(geoCollector.geocoll.keys())
//       );
//
//       //write demographics
//       const demographicsRecord = ds.record.getRecord(DS_DEMOGRAPHICS_KEY);
//       await demographicsRecord.whenReady();
//       await demographicsRecord.setWithAck(demographicsMap);
//
//       console.log(
//          "done writing geohashlist, geohashed positions, full tracks, and demographics"
//       );
//    });
// };

if (require.main === module) {
   initConnection().then((ds) => {
      const loop = () => {
         work2(ds);
      };
      loop();
      setInterval(loop, 10 * 1000);
   });
}
