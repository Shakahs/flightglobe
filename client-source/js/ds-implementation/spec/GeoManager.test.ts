import { GeoManagerCreator } from "../GeoManagerCreator";
import { createGlobe, destroyGlobe, provideConnection, sleep } from "./support";
import { GeoManager } from "../GeoManager";
import { FlightSubscriber } from "../FlightSubscriber";
import { Viewer } from "cesium";
import { CesiumPrimitiveHandler } from "../CesiumPrimitiveHandler";
import { FlightPosition } from "../../../../lib/types";
import { convertPositionToCartesian } from "../../ws-implementation/utility";
import { DemographicsManager } from "../DemographicsManager";
import { fakeFlightPosition } from "../../../../lib/spec/fakeData";
import { DisplayPreferences } from "../DisplayPreferences";
import { Globe } from "../../globe/globe";

describe("GeoManager", () => {
   let dsConn;
   let demographics: DemographicsManager;

   beforeAll(async () => {
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      // testServer = DSServer;
      // testServer.start();
      dsConn = await provideConnection();
      demographics = new DemographicsManager(dsConn);
   });

   describe("render and reconciliation", () => {
      let gmc: GeoManagerCreator;
      let gm: GeoManager;
      let fakeDataA: FlightPosition;
      let fakeDataB: FlightPosition;
      let flightA: FlightSubscriber;
      beforeEach(() => {
         gmc = new GeoManagerCreator(
            dsConn,
            demographics,
            new DisplayPreferences()
         );
         gmc.handleUpdate(["a"]);
         gm = gmc.geoManagerMap.get("a") as GeoManager;
         fakeDataA = fakeFlightPosition();
         fakeDataB = fakeFlightPosition();
         gm.handleUpdate({
            geohash: gm.geohash,
            flights: {
               icaoA: fakeDataA
            }
         });
         flightA = gm.flightSubscriberMap.get("icaoA") as FlightSubscriber;
      });

      // it("should update the flightPositions map when it receives data", function() {
      //    expect(gm.flightPositions.size).toEqual(0);
      //    const fakeDataA = fakeFlightPosition();
      //    const fakeDataB = fakeFlightPosition();
      //    gm.handleUpdate({
      //       geohash: gm.geohash,
      //       flights: {
      //          icaoA: fakeDataA,
      //          icaoB: fakeDataB
      //       }
      //    });
      //    expect(gm.flightPositions.size).toEqual(2);
      //    expect(gm.flightPositions.get("icaoA")).toEqual(fakeDataA);
      //    expect(gm.flightPositions.get("icaoB")).toEqual(fakeDataB);
      //    gm.handleUpdate({
      //       geohash: gm.geohash,
      //       flights: {
      //          icaoA: fakeDataA
      //       }
      //    });
      //    expect(gm.flightPositions.size).toEqual(1);
      //    expect(gm.flightPositions.get("icaoA")).toEqual(fakeDataA);
      // });

      it("should create FlightSubscribers when needed", function() {
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

      it("should update the positions of existing FlightSubscribers", function() {
         const newPos = fakeFlightPosition();
         gm.handleUpdate({
            geohash: gm.geohash,
            flights: {
               icaoA: newPos
            }
         });
         expect(flightA.cartesianPosition).toEqual(
            convertPositionToCartesian(newPos)
         );
      });

      it("should call the destroy method on FlightSubscribers when discarding them", function() {
         spyOn(flightA, "destroy");
         gm.handleUpdate({
            geohash: gm.geohash,
            flights: {
               icaoB: fakeDataB
            }
         });
         expect(flightA.destroy).toHaveBeenCalled();
      });

      it("should call the destroy method on FlightSubscribers when itself being destroyed", function() {
         spyOn(flightA, "destroy");
         gm.destroy();
         expect(flightA.destroy).toHaveBeenCalled();
      });

      it("should not store a CesiumPrimitiveHandler when a Cesium Viewer is not provided", function() {
         expect(gm.cph).toEqual(null);
      });
   });

   describe("Cesium Viewer integration", () => {
      let gmc: GeoManagerCreator;
      let gm: GeoManager;
      let globe: Globe;

      beforeEach(() => {
         globe = createGlobe();
         gmc = new GeoManagerCreator(
            dsConn,
            demographics,
            new DisplayPreferences(),
            globe
         );
         gmc.handleUpdate(["a"]);
         gm = gmc.geoManagerMap.get("a") as GeoManager;
      });

      afterEach(() => {
         destroyGlobe(globe);
      });

      it("should store a CesiumPrimitiveHandler when a Cesium Viewer is provided", function() {
         expect(gm.cph instanceof CesiumPrimitiveHandler).toBeTruthy();
      });

      it("has a debounced render method that calls the CesiumPrimitiveHandler render method", async () => {
         spyOn(gm.cph as CesiumPrimitiveHandler, "render").and.callThrough();
         gm.debouncedRender();
         expect(gm.cph?.render).not.toHaveBeenCalled();
         await sleep(2000);
         expect(gm.cph?.render).toHaveBeenCalled();
      });

      it("should call the destroy method on CesiumPrimitiveHandlers when itself being destroyed", function() {
         const cph = gm.cph as CesiumPrimitiveHandler;
         spyOn(cph, "destroy");
         expect(cph.destroy).not.toHaveBeenCalled();
         gm.destroy();
         expect(cph.destroy).toHaveBeenCalled();
         expect(gm.cph).toBeNull();
      });
   });
});
