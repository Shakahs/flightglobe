import { GeoManagerCreator } from "../GeoManagerCreator";
import { GeoManager } from "../GeoManager";
import { Viewer } from "cesium";
import {
   createViewer,
   destroyViewer,
   provideConnection,
   sleep
} from "./support";
import { Icao } from "../../types";
import { FlightSubscriber } from "../FlightSubscriber";
import { fakeFlightPosition } from "../../../../deepstream/spec/fakeData";
import { CesiumPrimitiveHandler } from "../CesiumPrimitiveHandler";
import { action, ObservableMap } from "mobx";

describe("CesiumPrimitiveHandler", () => {
   let viewer: Viewer;
   let cph: CesiumPrimitiveHandler;
   let dsConn;
   let fsMap: ObservableMap;
   let gmc: GeoManagerCreator;
   let gm: GeoManager;

   beforeAll(async () => {
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      // testServer = DSServer;
      // testServer.start();
      dsConn = await provideConnection();
   });

   beforeEach(() => {
      viewer = createViewer();
      gmc = new GeoManagerCreator(dsConn, viewer);
      gmc.handleUpdate(["a"]);
      gm = gmc.geoManagerMap.get("a") as GeoManager;
      cph = gm.cph as CesiumPrimitiveHandler;
   });

   it("should render a point", async function() {
      let fakePos = fakeFlightPosition();
      spyOn(cph, "renderPoint").and.callThrough();
      gm.handleUpdate({
         geohash: gm.geohash,
         flights: {
            icaoA: fakePos
         }
      });
      await sleep(1000);
      expect(cph.renderPoint).toHaveBeenCalled();
      expect(cph.getPoints().length).toEqual(1);
   });

   afterEach(() => {
      destroyViewer(viewer);
   });
});
