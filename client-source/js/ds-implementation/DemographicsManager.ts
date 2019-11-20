import { DeepstreamClient } from "@deepstream/client";
import { Event, Viewer } from "cesium";
import { action, ObservableMap } from "mobx";
import { Icao } from "../types";
import {
   FlightDemographics,
   FlightDemographicsCollection,
   GeohashBoolMap,
   GeohashBoolMapObservable
} from "../../../lib/types";
import { DS_DEMOGRAPHICS_KEY } from "../../../lib/constants";
import {
   getCameraPositionGeohash,
   getGeohashNeighbors
} from "../globe/geohashUtilities";

export class DemographicsManager {
   dsConn: DeepstreamClient;
   dsRecord;
   demographicsMap: ObservableMap<
      Icao,
      FlightDemographics
   > = new ObservableMap();
   viewer: Viewer | null = null;
   cameraEventDisposer: Event.RemoveCallback | null;
   detailedFlights: GeohashBoolMapObservable = new ObservableMap();

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
      this.detailedFlights.replace(neighborList);
   }
}
