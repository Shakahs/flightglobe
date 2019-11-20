import { Viewer } from "cesium";
import { CesiumPrimitiveHandler } from "../CesiumPrimitiveHandler";
import { ObservableMap } from "mobx";
import { GeoManagerCreator } from "../GeoManagerCreator";
import { GeoManager } from "../GeoManager";
import { createViewer, provideConnection } from "./support";
import { FlightSubscriber } from "../FlightSubscriber";
import { fakeFlightPosition } from "../../../../deepstream/spec/fakeData";
import { noop } from "lodash";
import { convertPositionToCartesian } from "../../ws-implementation/utility";
import { DemographicsManager } from "../DemographicsManager";
import { flightObj, flightStore } from "../../ws-implementation/spec/mockSetup";
import { FlightADemographic } from "../../ws-implementation/spec/mockData";

describe("FlightSubscriber", () => {
   let viewer: Viewer;
   let cph: CesiumPrimitiveHandler;
   let dsConn;
   let gmc: GeoManagerCreator;
   let gm: GeoManager;
   let fsA: FlightSubscriber;
   let demographics: DemographicsManager;

   beforeAll(async () => {
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      // testServer = DSServer;
      // testServer.start();
      dsConn = await provideConnection();
      demographics = new DemographicsManager(dsConn);
   });

   beforeEach(() => {
      viewer = createViewer();
      gmc = new GeoManagerCreator(dsConn, demographics, viewer);
      gmc.handleUpdate(["a"]);
      gm = gmc.geoManagerMap.get("a") as GeoManager;
      cph = gm.cph as CesiumPrimitiveHandler;
      fsA = new FlightSubscriber(
         dsConn,
         "icaoA",
         fakeFlightPosition(),
         noop,
         demographics
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
      expect(fsA.isDetailSelected).toBeFalsy();
      demographics.updateDetailedFlights(
         new Map([[fsA.position.geohash, true]])
      );
      expect(fsA.isDetailSelected).toBeTruthy();
   });
});