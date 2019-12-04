import "regenerator-runtime/runtime";
// import DSServer from "./mockServer";
import { GeoManagerCreator } from "../GeoManagerCreator";
import { GeoManager } from "../GeoManager";
import { createViewer, destroyViewer, provideConnection } from "./support";
import { DemographicsManager } from "../DemographicsManager";
import { DisplayPreferences } from "../DisplayPreferences";

describe("GeoManagerCreator", async () => {
   let testServer;
   let dsConn;
   let gmc: GeoManagerCreator;
   let demographics: DemographicsManager;
   beforeAll(async () => {
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      // testServer = DSServer;
      // testServer.start();
      dsConn = await provideConnection();
   });
   //
   // it("should subscribe to updates from Deepstream", async function() {
   //    const dsConn2 = await provideConnection();
   //    const gmc = new GeoManagerCreator(dsConn2);
   //    await gmc.subscribe();
   //    // spyOn(gmc, "handleUpdate").and.callThrough();
   //
   //    const remoteRecord = dsConn2.record.getList("geohashList");
   //    await remoteRecord.setEntriesWithAck(["abc"]);
   //    await sleep(1);
   //
   //    // expect(gmc.handleUpdate).toHaveBeenCalled();
   //    expect(gmc.geoManagerMap.size).toEqual(1);
   //    expect(3).toEqual(3);
   // });

   beforeEach(() => {
      demographics = new DemographicsManager(dsConn);
      gmc = new GeoManagerCreator(
         dsConn,
         demographics,
         new DisplayPreferences()
      );
   });

   afterEach(() => {
      gmc.destroy();
   });

   it("should create GeoManagers when receiving geohashes", function() {
      gmc.handleUpdate(["a"]);
      expect(gmc.geoManagerMap.size).toEqual(1);
      expect(gmc.geoManagerMap.has("a")).toBeTruthy();
      gmc.handleUpdate(["a", "b"]);
      expect(gmc.geoManagerMap.size).toEqual(2);
      expect(gmc.geoManagerMap.has("a")).toBeTruthy();
      expect(gmc.geoManagerMap.has("b")).toBeTruthy();
      expect(gmc.geoManagerMap.has("c")).toBeFalsy();
   });

   it("should destroy GeoManagers when they are no longer present in the geohash list", function() {
      gmc.handleUpdate(["a", "b"]);
      expect(gmc.geoManagerMap.size).toEqual(2);
      gmc.handleUpdate(["a"]);
      expect(gmc.geoManagerMap.size).toEqual(1);
      expect(gmc.geoManagerMap.has("a")).toBeTruthy();
      expect(gmc.geoManagerMap.has("b")).toBeFalsy();
   });

   it("should delete all GeoManagers when receiving an empty geohash list", function() {
      gmc.handleUpdate(["a", "b"]);
      gmc.handleUpdate([]);
      expect(gmc.geoManagerMap.size).toEqual(0);
   });

   it("should call the destroy method on a GeoManager when discarding it", function() {
      gmc.handleUpdate(["a"]);
      const geoA = gmc.geoManagerMap.get("a") as GeoManager;
      spyOn(geoA, "destroy").and.callThrough();
      gmc.handleUpdate([]);
      expect(geoA.destroy).toHaveBeenCalled();
   });

   it("should call the destroy method on a GeoManager when itself being destroyed", function() {
      gmc.handleUpdate(["a"]);
      const geoA = gmc.geoManagerMap.get("a") as GeoManager;
      spyOn(geoA, "destroy").and.callThrough();
      gmc.destroy();
      expect(geoA.destroy).toHaveBeenCalled();
   });

   it("should store a Cesium Viewer if one is provided", function() {
      const viewer = createViewer();
      const gmc2 = new GeoManagerCreator(
         dsConn,
         demographics,
         new DisplayPreferences(),
         viewer
      );
      expect(gmc2.viewer).toBe(viewer);
      destroyViewer(viewer);
      expect(gmc.viewer).toEqual(null);
   });
});
