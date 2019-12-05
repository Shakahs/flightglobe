import { Viewer } from "cesium";
import { CesiumPrimitiveHandler } from "../CesiumPrimitiveHandler";
import { GeoManagerCreator } from "../GeoManagerCreator";
import { GeoManager } from "../GeoManager";
import { createViewer, provideConnection } from "./support";
import { FlightSubscriber } from "../FlightSubscriber";
import { noop } from "lodash";
import { convertPositionToCartesian } from "../../ws-implementation/utility";
import { DemographicsManager } from "../DemographicsManager";
import { fakeFlightPosition } from "../../../../lib/spec/fakeData";
import { DisplayPreferences } from "../DisplayPreferences";

describe("FlightSubscriber", () => {
   let viewer: Viewer;
   let cph: CesiumPrimitiveHandler;
   let dsConn;
   let gmc: GeoManagerCreator;
   let gm: GeoManager;
   let fsA: FlightSubscriber;
   let demographics: DemographicsManager;
   let dp: DisplayPreferences;

   beforeAll(async () => {
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      // testServer = DSServer;
      // testServer.start();
      dsConn = await provideConnection();
      demographics = new DemographicsManager(dsConn);
   });

   beforeEach(() => {
      viewer = createViewer();
      gmc = new GeoManagerCreator(
         dsConn,
         demographics,
         new DisplayPreferences(),
         viewer
      );
      gmc.handleUpdate(["a"]);
      gm = gmc.geoManagerMap.get("a") as GeoManager;
      cph = gm.cph as CesiumPrimitiveHandler;
      dp = new DisplayPreferences();
      fsA = new FlightSubscriber(
         dsConn,
         "icaoA",
         fakeFlightPosition(),
         noop,
         demographics,
         dp
      );
   });

   it("should store updated positions", () => {
      const newPos = fakeFlightPosition();
      fsA.updatePosition(newPos);
      expect(fsA.cartesianPosition).toEqual(convertPositionToCartesian(newPos));
   });

   it("should call the render function when relevant state updates", function() {
      spyOn(fsA, "requestRender");
      expect(fsA.requestRender).not.toHaveBeenCalled();
      fsA.updatePosition(fakeFlightPosition());
      expect(fsA.requestRender).toHaveBeenCalled();
   });

   it("should get the demographic data", function() {
      expect(fsA.demographic).toBeUndefined();
      const demoData = {
         origin: "SFO",
         destination: "LAX",
         model: "747-800"
      };
      demographics.handleUpdate({ icaoA: demoData });
      expect(fsA.demographic).toEqual(demoData);
   });

   it("should get the detail selection status", function() {
      expect(fsA.isCameraAdjacent).toBeFalsy();
      demographics.updateCameraAdjacentFlights(
         new Map([[fsA.position.geohash, true]])
      );
      expect(fsA.isCameraAdjacent).toBeTruthy();
      demographics.updateCameraAdjacentFlights(new Map());
      expect(fsA.isCameraAdjacent).toBeFalsy();
   });

   describe("tracks", () => {
      describe("shouldFetchTrack / shouldDisplayTrack", () => {
         it("should resolve to false when shouldDisplay is false ", function() {
            expect(fsA.isSelected).toBeFalsy();
            expect(fsA.isCameraAdjacent).toBeFalsy();
            expect(fsA.shouldFetchTrack).toBeFalsy();
         });
         it("should resolve correctly based on selection status", function() {
            expect(fsA.shouldFetchTrack).toBeFalsy();
            demographics.updateSelectedFlights(new Map([[fsA.icao, true]]));
            dp.updateTrackDisplay({ showWhenSelected: false });
            expect(fsA.shouldFetchTrack).toBeFalsy();
            dp.updateTrackDisplay({ showWhenSelected: true });
            expect(fsA.shouldFetchTrack).toBeTruthy();
         });
         it("should resolve correctly based on camera adjacent status", function() {
            expect(fsA.shouldFetchTrack).toBeFalsy();
            demographics.updateCameraAdjacentFlights(
               new Map([[fsA.position.geohash, true]])
            );
            dp.updateTrackDisplay({ showWhenCameraAdjacent: false });
            expect(fsA.shouldFetchTrack).toBeFalsy();
            dp.updateTrackDisplay({ showWhenCameraAdjacent: true });
            expect(fsA.shouldFetchTrack).toBeTruthy();
         });
      });

      it("should call the subscribeTrackFull and unsubscribeTrackFull methods when needed", function() {
         spyOn(fsA, "subscribeTrackFull").and.callThrough();
         spyOn(fsA, "unsubscribeTrackFull").and.callThrough();
         expect(fsA.subscribeTrackFull).not.toHaveBeenCalled();
         demographics.updateSelectedFlights(new Map([[fsA.icao, true]]));
         dp.updateTrackDisplay({ showWhenSelected: true });
         expect(fsA.subscribeTrackFull).toHaveBeenCalled();
         demographics.updateSelectedFlights(new Map());
         expect(fsA.unsubscribeTrackFull).toHaveBeenCalled();
      });
   });
});
