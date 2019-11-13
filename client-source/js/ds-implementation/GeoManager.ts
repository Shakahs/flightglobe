import { DeepstreamClient } from "@deepstream/client";
import { FlightPosition, Geohash, GeoPositionList } from "../../../lib/types";
import { ObservableMap } from "mobx";
import { Icao } from "../types";
import { FlightSubscriber } from "./FlightSubscriber";

export class GeoManager {
   dsConn: DeepstreamClient;
   dsRecord;
   geohash: Geohash;
   flightPositions = new ObservableMap<Icao, FlightPosition>(
      undefined,
      undefined,
      "flightPositions"
   );
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
      this.flightPositions.replace(update.flights);
   }

   destroy() {
      this.dsRecord?.discard();
   }
}
