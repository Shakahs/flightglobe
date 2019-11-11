import { fakeRedisFlightRecord, fillArray } from "./fakeData";
import { DeepstreamFlightRecord, RedisFlightRecord } from "../../lib/types";
import { dsRecordFromRedis, extractLastPositions } from "../src/utility";
import { last } from "lodash";

describe("utility functions", () => {
   describe("extractPositions should extract an array of the correct size", () => {
      it("from a normal RedisFlightRecord", function() {
         const input = fillArray<RedisFlightRecord>(fakeRedisFlightRecord, 50);
         const output = extractLastPositions(input, 10);
         expect(output.length).toEqual(10);
         expect(last(output)).toEqual(input[49].position);
      });

      it("from a single item RedisFlightRecord", function() {
         const input = fillArray<RedisFlightRecord>(fakeRedisFlightRecord, 1);
         const output = extractLastPositions(input, 1);
         expect(output.length).toEqual(1);
         expect(last(output)).toEqual(input[0].position);
      });

      it("from an insufficiently sized RedisFlightRecord", function() {
         const input = fillArray<RedisFlightRecord>(fakeRedisFlightRecord, 3);
         const output = extractLastPositions(input, 5);
         expect(output.length).toEqual(3);
         expect(last(output)).toEqual(input[2].position);
      });

      it("and should return all positions if a count is not specified", function() {
         const input = fillArray<RedisFlightRecord>(fakeRedisFlightRecord, 50);
         const output = extractLastPositions(input);
         expect(output.length).toEqual(50);
         expect(last(output)).toEqual(input[49].position);
      });
   });

   describe("dsRecordFromRedis", () => {
      it("should convert records", function() {
         const input = fillArray<RedisFlightRecord>(fakeRedisFlightRecord, 50);
         const output = dsRecordFromRedis(input);
         const lastPos = last(input) as RedisFlightRecord;
         expect(output.trackRecent.length).toEqual(10);
         expect(output.trackFull.length).toEqual(50);
         expect(output.icao).toEqual(lastPos.icao);
         expect(output.demographic).toEqual(lastPos.demographic);
         expect(output.latestPosition).toEqual(lastPos.position);
      });
   });
});
