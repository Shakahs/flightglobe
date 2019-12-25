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
import { shallowEnhancer } from "mobx/lib/types/modifiers";
import { fromStream } from "mobx-utils";
import { ajax } from "rxjs/ajax";
import polling from "rx-polling";

export class DemographicsManager {
   dsRecord;
   globe: Globe | null = null;
   demographicsMap: ObservableMap<Icao, FlightDemographics> = observable.map(
      [],
      { deep: false }
   );
   filteredFlights = observable.map<Icao, boolean>(undefined, {
      deep: false
   });
   @observable isFiltered: boolean = false;
   selectedFlights = observable.map<Icao, boolean>(undefined, {
      deep: false
   });
   selectionClickChange = new EventEmitter();

   constructor(globe?: Globe) {
      this.globe = globe || null;

      const request$ = ajax({
         url: "http://localhost:3000/api/demographicsmap"
      });

      polling(request$, { interval: 10000 }).subscribe((res) => {
         this.demographicsMap.replace(res.response);
      });
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
