import {
   DeepstreamFlightRecord,
   DeepstreamGeo,
   DeepstreamGeoMap
} from "../../lib/types";

export class DeepstreamGeocollection {
   geocoll: DeepstreamGeoMap;

   constructor() {
      this.geocoll = new Map();
   }

   getSetGeo(geohash: string): DeepstreamGeo {
      let thisGeo = this.geocoll.get(geohash);
      if (!thisGeo) {
         thisGeo = { geohash, flights: new Map() };
         this.geocoll.set(geohash, thisGeo);
      }
      return thisGeo;
   }

   store(r: DeepstreamFlightRecord) {
      const geoColl = this.getSetGeo(r.latestPosition.geohash);
      geoColl.flights.set(r.icao, r);
   }
}
