import "regenerator-runtime/runtime";
// import DSServer from "./mockServer";
import { DeepstreamClient } from "@deepstream/client";
import { GeoManagerCreator } from "../GeoManagerCreator";
import { GeoManager } from "../GeoManager";
const {
   REMOTE_WINS
} = require("@deepstream/client/dist/record/merge-strategy");

const provideConnection = async () => {
   const newConn = new DeepstreamClient("localhost:6020", {
      mergeStrategy: REMOTE_WINS
   });
   await newConn.login();
   return newConn;
};

const sleep = (n: number) =>
   new Promise(
      (resolve) => (
         setTimeout(() => {
            resolve();
         }),
         n * 1000
      )
   );

describe("GeoManagerCreator", async () => {
   let testServer;
   let dsConn;
   let gmc: GeoManagerCreator;
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
      gmc = new GeoManagerCreator(dsConn);
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
      spyOn(geoA, "destroy");
      gmc.handleUpdate([]);
      expect(geoA.destroy).toHaveBeenCalled();
   });
});
