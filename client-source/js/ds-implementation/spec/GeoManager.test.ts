import { GeoManagerCreator } from "../GeoManagerCreator";
import { provideConnection } from "./support";
import { GeoManager } from "../GeoManager";
import { fakeFlightPosition } from "../../../../deepstream/spec/fakeData";

describe("GeoManager", () => {
   let dsConn;
   let gmc: GeoManagerCreator;
   let gm: GeoManager;
   beforeAll(async () => {
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      // testServer = DSServer;
      // testServer.start();
      dsConn = await provideConnection();
   });

   beforeEach(() => {
      gmc = new GeoManagerCreator(dsConn);
      gmc.handleUpdate(["a"]);
      gm = gmc.geoManagerMap.get("a") as GeoManager;
   });

   it("should update the flightPositions map when it receives data", function() {
      expect(gm.flightPositions.size).toEqual(0);
      const fakeDataA = fakeFlightPosition();
      const fakeDataB = fakeFlightPosition();
      gm.handleUpdate({
         geohash: gm.geohash,
         flights: {
            icaoA: fakeDataA,
            icaoB: fakeDataB
         }
      });
      expect(gm.flightPositions.size).toEqual(2);
      expect(gm.flightPositions.get("icaoA")).toEqual(fakeDataA);
      expect(gm.flightPositions.get("icaoB")).toEqual(fakeDataB);
      gm.handleUpdate({
         geohash: gm.geohash,
         flights: {
            icaoA: fakeDataA
         }
      });
      expect(gm.flightPositions.size).toEqual(1);
      expect(gm.flightPositions.get("icaoA")).toEqual(fakeDataA);
   });

   it("should create FlightSubscribers when needed", function() {
      expect(gm.flightSubscriberMap.size).toEqual(0);
      const fakeDataA = fakeFlightPosition();
      const fakeDataB = fakeFlightPosition();
      gm.handleUpdate({
         geohash: gm.geohash,
         flights: {
            icaoA: fakeDataA
         }
      });
      expect(gm.flightSubscriberMap.size).toEqual(1);
      expect(gm.flightSubscriberMap.has("icaoA")).toBeTruthy();
      gm.handleUpdate({
         geohash: gm.geohash,
         flights: {
            icaoA: fakeDataA,
            icaoB: fakeDataB
         }
      });
      expect(gm.flightSubscriberMap.size).toEqual(2);
      expect(gm.flightSubscriberMap.has("icaoA")).toBeTruthy();
      expect(gm.flightSubscriberMap.has("icaoB")).toBeTruthy();
   });

   it("should destroy FlightSubscribers when they are longer needed", function() {
      const fakeDataA = fakeFlightPosition();
      const fakeDataB = fakeFlightPosition();
      gm.handleUpdate({
         geohash: gm.geohash,
         flights: {
            icaoA: fakeDataA,
            icaoB: fakeDataB
         }
      });
      gm.handleUpdate({
         geohash: gm.geohash,
         flights: {
            icaoB: fakeDataB
         }
      });
      expect(gm.flightSubscriberMap.size).toEqual(1);
      expect(gm.flightSubscriberMap.has("icaoA")).toBeFalsy();
      expect(gm.flightSubscriberMap.has("icaoB")).toBeTruthy();
   });
});
