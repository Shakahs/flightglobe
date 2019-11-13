import "regenerator-runtime/runtime";
// import DSServer from "./mockServer";
import { DeepstreamClient } from "@deepstream/client";
import { GeoManagerCreator } from "../GeoManagerCreator";
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

   it("should create and delete GeoManagers when receiving geohashes", function() {
      const gmc = new GeoManagerCreator(dsConn);
      gmc.handleUpdate(["a"]);
      expect(gmc.geoManagerMap.has("a")).toBeTruthy();
      expect(gmc.geoManagerMap.size).toEqual(1);
      gmc.handleUpdate(["b", "c"]);
      expect(gmc.geoManagerMap.size).toEqual(2);
      expect(gmc.geoManagerMap.has("a")).toBeFalsy();
      expect(gmc.geoManagerMap.has("b")).toBeTruthy();
      expect(gmc.geoManagerMap.has("c")).toBeTruthy();
   });
});
