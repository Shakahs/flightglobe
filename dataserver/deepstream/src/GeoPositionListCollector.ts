import {
   MasterFlightRecord,
   GeoPositionList,
   GeoPositionListCollection
} from "../../../lib/types";

export class GeoPositionListCollector {
   geocoll: GeoPositionListCollection;

   constructor() {
      this.geocoll = new Map();
   }

   getSetGeo(geohash: string): GeoPositionList {
      //use only the first character to key the geohash collections
      const shortenedGeohash = geohash.charAt(0);
      let thisGeo = this.geocoll.get(shortenedGeohash);
      if (!thisGeo) {
         thisGeo = { geohash: shortenedGeohash, flights: {} };
         this.geocoll.set(shortenedGeohash, thisGeo);
      }
      return thisGeo;
   }

   store(r: MasterFlightRecord) {
      const geo = this.getSetGeo(r.latestPosition.geohash);
      geo.flights[r.icao] = r.latestPosition;
   }
}
