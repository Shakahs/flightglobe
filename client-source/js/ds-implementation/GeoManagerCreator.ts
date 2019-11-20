import { DeepstreamClient } from "@deepstream/client";
import { Geohash } from "../../../lib/types";
import { GeoManager } from "./GeoManager";
import { without } from "lodash-es";
import { configure } from "mobx";
import { Viewer } from "cesium";
import { DS_GEOHASH_LIST_KEY } from "../../../lib/constants";
import { DemographicsManager } from "./DemographicsManager";
require("./mobxConfig");

export class GeoManagerCreator {
   dsConn: DeepstreamClient;
   dsRecord;
   geoManagerMap: Map<Geohash, GeoManager>;
   viewer: Viewer | null = null;
   demographics: DemographicsManager;

   constructor(
      dsConn: DeepstreamClient,
      demographics: DemographicsManager,
      viewer?: Viewer
   ) {
      this.dsConn = dsConn;
      this.demographics = demographics;
      this.viewer = viewer || null;
      this.geoManagerMap = new Map();
   }

   subscribe() {
      this.dsRecord = this.dsConn.record.getList(DS_GEOHASH_LIST_KEY);
      this.dsRecord.subscribe(this.handleUpdate.bind(this));
   }

   handleUpdate(geohashList: Geohash[]) {
      geohashList.forEach((geohash) => {
         if (!this.geoManagerMap.has(geohash)) {
            const newGm = new GeoManager(
               this.dsConn,
               geohash,
               this.demographics,
               this.viewer
            );
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
