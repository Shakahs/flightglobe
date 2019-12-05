import { DeepstreamClient } from "@deepstream/client";
import { Event, Viewer } from "cesium";
import {
   action,
   autorun,
   computed,
   observable,
   ObservableMap,
   reaction
} from "mobx";
import {
   FlightDemographics,
   FlightDemographicsCollection,
   Geohash,
   GeohashBoolMap,
   Icao
} from "../../../lib/types";
import { DS_DEMOGRAPHICS_KEY } from "../../../lib/constants";
import {
   getCameraPositionGeohash,
   getGeohashNeighbors
} from "../globe/geohashUtilities";
import { EventEmitter } from "events";
import { Globe } from "../globe/globe";

export class DemographicsManager {
   dsConn: DeepstreamClient;
   dsRecord;
   demographicsMap: ObservableMap<
      Icao,
      FlightDemographics
   > = new ObservableMap();
   globe: Globe | null = null;
   filteredFlights = observable.map<Icao, boolean>(undefined, {
      deep: false
   });
   @observable isFiltered: boolean = false;
   selectedFlights = observable.map<Icao, boolean>(undefined, {
      deep: false
   });
   selectionClickChange = new EventEmitter();

   constructor(dsConn: DeepstreamClient, globe?: Globe) {
      this.dsConn = dsConn;
      this.globe = globe || null;
   }

   subscribe() {
      this.dsRecord = this.dsConn.record.getRecord(DS_DEMOGRAPHICS_KEY);
      this.dsRecord.subscribe(this.handleUpdate.bind(this));
   }

   @action
   handleUpdate(d: FlightDemographicsCollection) {
      this.demographicsMap.replace(d);
   }

   @action
   updateIsFiltered(isFiltered: boolean) {
      this.isFiltered = isFiltered;
   }

   @action
   updateFilteredFlights(filterResult: Map<Icao, boolean>) {
      this.filteredFlights.clear();
      this.filteredFlights.merge(filterResult);
   }

   @action
   updateSelectedFlights(selectResult: Map<Icao, boolean>) {
      this.selectedFlights.clear();
      this.selectedFlights.merge(selectResult);
   }

   @computed
   get cameraAdjacentFlights(): Map<Geohash, boolean> {
      if (this.globe) {
         return getGeohashNeighbors(
            getCameraPositionGeohash(this.globe.cameraPosition)
         );
      }
      return new Map();
   }
}
