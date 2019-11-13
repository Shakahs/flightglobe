import { DeepstreamClient } from "@deepstream/client";
import { Geohash } from "../../../lib/types";
import { GeoManager } from "./GeoManager";
import { without } from "lodash-es";

export class GeoManagerCreator {
   dsConn: DeepstreamClient;
   dsRecord;
   geoManagerMap: Map<Geohash, GeoManager>;
   constructor(dsConn: DeepstreamClient) {
      this.dsConn = dsConn;
      this.geoManagerMap = new Map();
   }

   subscribe() {
      this.dsRecord = this.dsConn.record.getList("geohashList");
      this.dsRecord.subscribe(this.handleUpdate);
   }

   handleUpdate(geohashList: Geohash[]) {
      geohashList.forEach((s) => {
         if (!this.geoManagerMap.has(s)) {
            this.geoManagerMap.set(s, new GeoManager(this.dsConn, s));
         }
      });

      without(Array.from(this.geoManagerMap.keys()), ...geohashList).forEach(
         (s) => {
            this.geoManagerMap.get(s)?.destroy();
            this.geoManagerMap.delete(s);
         }
      );
   }

   destroy() {
      this.geoManagerMap.forEach((s) => {
         s.destroy();
      });
      // this.dsRecord.discard();
   }
}
