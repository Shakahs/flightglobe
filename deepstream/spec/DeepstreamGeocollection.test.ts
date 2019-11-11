import { fakeRedisFlightRecord, fillArray } from "./fakeData";
import { GeoPositionListCollector } from "../src/GeoPositionListCollector";

describe("DeepstreamGeocollection", () => {
   it("should not create duplicate geo containers", function() {
      const dg = new GeoPositionListCollector();
      const input = fakeRedisFlightRecord();
      expect(dg.geocoll.size).toEqual(0);
      const result1 = dg.getSetGeo(input.position.geohash);
      expect(dg.geocoll.size).toEqual(1);
      const result2 = dg.getSetGeo(input.position.geohash);
      dg.getSetGeo(fakeRedisFlightRecord().position.geohash);
      expect(dg.geocoll.size).toEqual(2);
      expect(result1).toBe(result2);
   });
});
