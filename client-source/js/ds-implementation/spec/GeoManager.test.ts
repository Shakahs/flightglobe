import { GeoManagerCreator } from "../GeoManagerCreator";
import {
   createViewer,
   destroyViewer,
   provideConnection,
   sleep
} from "./support";
import { GeoManager } from "../GeoManager";
import { fakeFlightPosition } from "../../../../deepstream/spec/fakeData";
import { FlightSubscriber } from "../FlightSubscriber";
import { Viewer } from "cesium";
import { CesiumPrimitiveHandler } from "../CesiumPrimitiveHandler";

describe("GeoManager", () => {
   let dsConn;

   beforeAll(async () => {
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      // testServer = DSServer;
      // testServer.start();
      dsConn = await provideConnection();
   });

   describe("non Cesium functionality", () => {
      let gmc: GeoManagerCreator;
      let gm: GeoManager;
      beforeEach(() => {
         gmc = new GeoManagerCreator(dsConn);
         gmc.handleUpdate(["a"]);
         gm = gmc.geoManagerMap.get("a") as GeoManager;
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

      it("should call the destroy method on FlightSubscribers when discarding them", function() {
         const fakeDataA = fakeFlightPosition();
         const fakeDataB = fakeFlightPosition();
         gm.handleUpdate({
            geohash: gm.geohash,
            flights: {
               icaoA: fakeDataA,
               icaoB: fakeDataB
            }
         });
         const flightA = gm.flightSubscriberMap.get(
            "icaoA"
         ) as FlightSubscriber;
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
         const fakeDataA = fakeFlightPosition();
         gm.handleUpdate({
            geohash: gm.geohash,
            flights: {
               icaoA: fakeDataA
            }
         });
         const flightA = gm.flightSubscriberMap.get(
            "icaoA"
         ) as FlightSubscriber;
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
      let viewer: Viewer;

      beforeEach(() => {
         viewer = createViewer();
         gmc = new GeoManagerCreator(dsConn, viewer);
         gmc.handleUpdate(["a"]);
         gm = gmc.geoManagerMap.get("a") as GeoManager;
      });

      afterEach(() => {
         destroyViewer(viewer);
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
   });
});
