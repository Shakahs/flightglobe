import { fakeRedisFlightRecord, fillArray } from "./fakeData";
import { RedisFlightRecord } from "../../lib/types";
import { extractPositions } from "../src/utility";

describe("utility functions", () => {
   describe("extractPositions", () => {
      it("should correctly extract a position array  ", function() {
         const input = fillArray<RedisFlightRecord>(fakeRedisFlightRecord, 10);
         const output = extractPositions(input, 2);
         expect(output.length).toEqual(2);
      });
   });
});
