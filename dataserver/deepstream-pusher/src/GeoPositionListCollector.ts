import {
   MasterFlightRecord,
   GeoPositionList,
   GeoPositionListCollection,
   Icao,
   FlightPosition
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

   store(geohash: string, icao: Icao, position: FlightPosition) {
      this.getSetGeo(geohash).flights[icao] = position;
   }
}
