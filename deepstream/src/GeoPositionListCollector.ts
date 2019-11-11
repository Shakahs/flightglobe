import {
   MasterFlightRecord,
   GeoPositionList,
   GeoPositionListCollection
} from "../../lib/types";

export class GeoPositionListCollector {
   geocoll: GeoPositionListCollection;

   constructor() {
      this.geocoll = new Map();
   }

   getSetGeo(geohash: string): GeoPositionList {
      let thisGeo = this.geocoll.get(geohash);
      if (!thisGeo) {
         thisGeo = { geohash, flights: {} };
         this.geocoll.set(geohash, thisGeo);
      }
      return thisGeo;
   }

   store(r: MasterFlightRecord) {
      const geo = this.getSetGeo(r.latestPosition.geohash);
      geo.flights[r.icao] = r.latestPosition;
   }
}
