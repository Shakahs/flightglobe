import { GeoManagerCreator } from "../GeoManagerCreator";
import { GeoManager } from "../GeoManager";
import { createGlobe, destroyGlobe, provideConnection, sleep } from "./support";
import { FlightSubscriber } from "../FlightSubscriber";
import { CesiumPrimitiveHandler } from "../CesiumPrimitiveHandler";
import { ObservableMap } from "mobx";
import { DemographicsManager } from "../DemographicsManager";
import { fakeFlightPosition } from "../../../../lib/spec/fakeData";
import { DisplayPreferences } from "../DisplayPreferences";
import { Globe } from "../../globe/globe";

describe("CesiumPrimitiveHandler", () => {
   let globe: Globe;
   let cph: CesiumPrimitiveHandler;
   let dsConn;
   let fsMap: ObservableMap;
   let gmc: GeoManagerCreator;
   let gm: GeoManager;
   let demographics: DemographicsManager;
   let fsA: FlightSubscriber;
   let dp: DisplayPreferences;

   beforeAll(async () => {
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      // testServer = DSServer;
      // testServer.start();
      dsConn = await provideConnection();
      demographics = new DemographicsManager(dsConn);
   });

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
      cph = gm.cph as CesiumPrimitiveHandler;
      dp = new DisplayPreferences();
      fsA = new FlightSubscriber(
         dsConn,
         "icaoA",
         fakeFlightPosition(),
         gm.debouncedRender,
         demographics,
         dp
      );
   });

   afterEach(() => {
      destroyGlobe(globe);
   });

   describe("points", () => {
      it("should render a point", async function() {
         let fakePos = fakeFlightPosition();
         spyOn(cph, "renderPoint").and.callThrough();
         gm.reconcile({
            geohash: gm.geohash,
            flights: {
               icaoA: fakePos
            }
         });
         await sleep(1000);
         expect(cph.renderPoint).toHaveBeenCalled();
         expect(cph.getPoints().length).toEqual(1);
      });
   });

   describe("tracks", () => {
      it("should call renderTrack/destroyTrack", async function() {
         spyOn(cph, "renderTrack");
         spyOn(cph, "destroyTrack");
         expect(fsA.shouldDisplayTrack).toBeFalsy();
         expect(cph.renderTrack).not.toHaveBeenCalled();
         demographics.updateSelectedFlights(new Map([[fsA.icao, true]]));
         dp.updateTrackDisplay({ showWhenSelected: true });
         fsA.updateTrackFull([fakeFlightPosition(), fakeFlightPosition()]);
         expect(fsA.shouldDisplayTrack).toBeTruthy();
         await sleep(1000);
         expect(cph.renderTrack).toHaveBeenCalled();
      });
   });
});
