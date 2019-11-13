import { DeepstreamClient } from "@deepstream/client";
import { Geohash } from "../../../lib/types";
import { GeoManager } from "./GeoManager";
import { without } from "lodash-es";

export class GeoManagerCreator {
   dsConn: DeepstreamClient;
   geoManagerMap: Map<Geohash, GeoManager>;
   constructor(dsConn: DeepstreamClient) {
      this.dsConn = dsConn;
      this.geoManagerMap = new Map();
   }

   async subscribe() {
      const geohashList = await this.dsConn.record.getList("geohashList");
      geohashList.subscribe(this.handleUpdate);
   }

   handleUpdate(geohashList: string[]) {
      geohashList.forEach((s) => {
         if (!this.geoManagerMap.has(s)) {
            this.geoManagerMap.set(s, new GeoManager());
         }
      });
      const toDelete = without(
         Array.from(this.geoManagerMap.keys()),
         ...geohashList
      );
      toDelete.forEach((s) => {
         this.geoManagerMap.delete(s);
      });
   }
}
