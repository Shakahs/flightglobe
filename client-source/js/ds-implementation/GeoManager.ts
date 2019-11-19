import { DeepstreamClient } from "@deepstream/client";
import { FlightPosition, Geohash, GeoPositionList } from "../../../lib/types";
import { ObservableMap } from "mobx";
import { Icao } from "../types";
import { FlightSubscriber } from "./FlightSubscriber";
import { without, forEach, keys } from "lodash";

export class GeoManager {
   dsConn: DeepstreamClient;
   dsRecord;
   geohash: Geohash;
   // flightPositions = new ObservableMap<Icao, FlightPosition>(
   //    undefined,
   //    undefined,
   //    "flightPositions"
   // );
   flightSubscriberMap: Map<Icao, FlightSubscriber>;

   constructor(dsConn: DeepstreamClient, geohash: Geohash) {
      this.dsConn = dsConn;
      this.geohash = geohash;
      this.flightSubscriberMap = new Map();
   }

   subscribe() {
      this.dsRecord = this.dsConn.record.getRecord(this.geohash);
      this.dsRecord.subscribe(this.handleUpdate);
   }

   handleUpdate(update: GeoPositionList) {
      // this.flightPositions.replace(update.flights);

      //create new FlightSubscribers under the respective ICAO key
      forEach(update.flights, (fpos, icao) => {
         if (!this.flightSubscriberMap.has(icao)) {
            this.flightSubscriberMap.set(
               icao,
               new FlightSubscriber(this.dsConn, icao, fpos, () => {})
            );
         }
      });

      // the provided flight position update is our source of truth,
      // so subtract the flight position keys from our current flightSubscriberMap,
      // the resulting keys are flights that need to be deleted
      without(
         Array.from(this.flightSubscriberMap.keys()),
         ...keys(update.flights)
      ).forEach((d) => {
         this.flightSubscriberMap.get(d)?.destroy();
         this.flightSubscriberMap.delete(d);
      });
   }

   destroy() {
      this.dsRecord?.discard();
      this.flightSubscriberMap.forEach((f) => f.destroy());
   }
}
