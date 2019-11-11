import {
   DeepstreamFlightRecord,
   DeepstreamGeo,
   DeepstreamGeoMap,
   FlightPosition,
   RedisFlightRecord
} from "../../lib/types";
import { takeRight, last } from "lodash";

export const extractLastPositions = (
   sr: RedisFlightRecord[],
   count?: number
): FlightPosition[] => {
   let rightMost = sr;
   if (count) {
      rightMost = takeRight(sr, count) as RedisFlightRecord[];
   }

   const newArr: FlightPosition[] = [];
   rightMost.forEach((r) => {
      newArr.push(r.position);
   });
   return newArr;
};

export const dsRecordFromRedis = (
   sourceRecords: RedisFlightRecord[]
): DeepstreamFlightRecord => {
   const lastRecord = last(sourceRecords) as RedisFlightRecord;
   const newRecord = {
      icao: lastRecord.icao,
      demographic: lastRecord.demographic,
      latestPosition: lastRecord.position,
      trackRecent: extractLastPositions(sourceRecords, 10),
      trackFull: extractLastPositions(sourceRecords)
   };
   return newRecord;
};
