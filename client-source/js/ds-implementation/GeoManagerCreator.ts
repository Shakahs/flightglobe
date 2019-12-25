import { DeepstreamClient } from "@deepstream/client";
import {
   FlightDemographics,
   Geohash,
   GeoPositionList,
   Icao
} from "../../../lib/types";
import { GeoManager } from "./GeoManager";
import { without } from "lodash";
import { configure, observable, ObservableMap } from "mobx";
import { Viewer } from "cesium";
import { DS_GEOHASH_LIST_KEY } from "../../../lib/constants";
import { DemographicsManager } from "./DemographicsManager";
import { DisplayPreferences } from "./DisplayPreferences";
import { Globe } from "../globe/globe";
import { ajax } from "rxjs/ajax";
import polling from "rx-polling";
require("./mobxConfig");

export class GeoManagerCreator {
   geoManagerMap: Map<Geohash, GeoManager>;
   geoCollectedPositions: ObservableMap<
      string,
      GeoPositionList
   > = observable.map([], { deep: false });
   globe: Globe | null = null;
   demographics: DemographicsManager;
   displayPreferences: DisplayPreferences;

   constructor(
      demographics: DemographicsManager,
      displayPreferences: DisplayPreferences,
      globe?: Globe
   ) {
      this.demographics = demographics;
      this.globe = globe || null;
      this.geoManagerMap = new Map();
      this.displayPreferences = displayPreferences;

      const geohashRequest = ajax({
         url: "http://localhost:3000/api/geohashset"
      });
      const boundUpdate = this.handleUpdate.bind(this);
      polling(geohashRequest, { interval: 10000 }).subscribe((res) => {
         boundUpdate(res.response);
      });

      const geoPositionRequest = ajax({
         url: "http://localhost:3000/api/geocollectedpositions"
      });
      polling(geoPositionRequest, { interval: 10000 }).subscribe((res) => {
         this.geoCollectedPositions.replace(res.response);
      });
   }

   handleUpdate(geohashList: Geohash[]) {
      geohashList.forEach((geohash) => {
         if (!this.geoManagerMap.has(geohash)) {
            const newGm = new GeoManager(
               this,
               geohash,
               this.demographics,
               this.displayPreferences,
               this.globe
            );
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
