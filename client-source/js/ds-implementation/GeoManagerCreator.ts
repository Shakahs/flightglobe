import { DeepstreamClient } from "@deepstream/client";
import { Geohash } from "../../../lib/types";
import { GeoManager } from "./GeoManager";
import { without } from "lodash-es";
import { configure } from "mobx";
import { Viewer } from "cesium";
require("./mobxConfig");

export class GeoManagerCreator {
   dsConn: DeepstreamClient;
   dsRecord;
   geoManagerMap: Map<Geohash, GeoManager>;
   viewer: Viewer | null = null;

   constructor(dsConn: DeepstreamClient, viewer?: Viewer) {
      this.dsConn = dsConn;
      this.geoManagerMap = new Map();
      this.viewer = viewer || null;
   }

   subscribe() {
      this.dsRecord = this.dsConn.record.getList("geohashList");
      this.dsRecord.subscribe(this.handleUpdate.bind(this));
   }

   handleUpdate(geohashList: Geohash[]) {
      geohashList.forEach((geohash) => {
         if (!this.geoManagerMap.has(geohash)) {
            const newGm = new GeoManager(this.dsConn, geohash, this.viewer);
            newGm.subscribe();
            this.geoManagerMap.set(geohash, newGm);
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
