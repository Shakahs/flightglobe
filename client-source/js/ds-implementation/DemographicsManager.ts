import { DeepstreamClient } from "@deepstream/client";
import { Viewer } from "cesium";
import { ObservableMap } from "mobx";
import { Icao } from "../types";
import {
   FlightDemographics,
   FlightDemographicsCollection
} from "../../../lib/types";
import { DS_DEMOGRAPHICS_KEY } from "../../../lib/constants";

export class DemographicsManager {
   dsConn: DeepstreamClient;
   dsRecord;
   demographics: ObservableMap<Icao, FlightDemographics> = new ObservableMap();

   constructor(dsConn: DeepstreamClient) {
      this.dsConn = dsConn;
   }

   subscribe() {
      this.dsRecord = this.dsConn.record.getRecord(DS_DEMOGRAPHICS_KEY);
      this.dsRecord.subscribe(this.handleUpdate.bind(this));
   }

   handleUpdate(d: FlightDemographicsCollection) {
      this.demographics.replace(d);
   }
}
