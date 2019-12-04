import { DeepstreamClient } from "@deepstream/client";
import { Event, Viewer } from "cesium";
import { action, observable, ObservableMap } from "mobx";
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

export class DemographicsManager {
   dsConn: DeepstreamClient;
   dsRecord;
   demographicsMap: ObservableMap<
      Icao,
      FlightDemographics
   > = new ObservableMap();
   viewer: Viewer | null = null;
   cameraEventDisposer: Event.RemoveCallback | null;
   cameraAdjacentFlights = observable.map<Geohash, boolean>(undefined, {
      deep: false
   });
   filteredFlights = observable.map<Icao, boolean>(undefined, {
      deep: false
   });
   @observable isFiltered: boolean = false;
   selectedFlights = observable.map<Icao, boolean>(undefined, {
      deep: false
   });
   selectionClickChange = new EventEmitter();

   constructor(dsConn: DeepstreamClient, viewer?: Viewer) {
      this.dsConn = dsConn;
      this.viewer = viewer || null;
      this.cameraEventDisposer = viewer
         ? viewer.camera.changed.addEventListener(
              this.handleCameraChange.bind(this)
           )
         : null;
   }

   subscribe() {
      this.dsRecord = this.dsConn.record.getRecord(DS_DEMOGRAPHICS_KEY);
      this.dsRecord.subscribe(this.handleUpdate.bind(this));
   }

   @action
   handleUpdate(d: FlightDemographicsCollection) {
      this.demographicsMap.replace(d);
   }

   handleCameraChange() {
      if (this.viewer) {
         const focusGeo = getCameraPositionGeohash(this.viewer);
         const neighborList = getGeohashNeighbors(focusGeo);
         this.updateDetailedFlights(neighborList);
      }
   }

   @action
   updateDetailedFlights(neighborList: GeohashBoolMap) {
      this.cameraAdjacentFlights.clear();
      this.cameraAdjacentFlights.merge(neighborList);
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
}
