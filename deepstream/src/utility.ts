import { FlightPosition, RedisFlightRecord } from "../../lib/types";
import { takeRight } from "lodash-es";

export const extractPositions = (
   sr: RedisFlightRecord[],
   count: number
): FlightPosition[] => {
   const rightMost = takeRight(sr, count) as RedisFlightRecord[];
   const newArr: FlightPosition[] = [];
   rightMost.forEach((r) => {
      newArr.push(r.position);
   });
   return newArr;
};
