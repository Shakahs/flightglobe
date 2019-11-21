import { action, configure, observable, ObservableMap } from "mobx";
import {
   AircraftModelData,
   DemographicsUpdate,
   Icao,
   LabelDisplayOptions,
   LabelDisplayOptionsUpdate,
   Message,
   PointDisplayOptions,
   PointDisplayOptionsUpdate,
   PositionUpdate,
   TrailDisplayOptions,
   TrailDisplayOptionsUpdate
} from "../types";
import { newFlightRecord } from "./utility";
import { forEach, has, merge } from "lodash-es";
import { FlightObj } from "./flightObj";
import { GeoCollection } from "./geoCollection";
import { Color, Event, Viewer } from "cesium";
import { BootData, FlightRecord } from "../../../lib/types";
import {
   LabelDisplayOptionDefaults,
   PointDisplayOptionDefaults,
   SelectedPointDisplayOptionDefaults,
   TrailDisplayOptionDefaults
} from "../constants";

const aircraftModels: AircraftModelData = require("../../resources/aircraft.json");

const Geohash = require("latlon-geohash");

configure({
   enforceActions: "observed"
});

export class FlightStore {
   flightData = new ObservableMap<Icao, FlightRecord>(
      undefined,
      undefined,
      "flightData"
   );
   detailedFlights = new ObservableMap<string, boolean>(
      undefined,
      undefined,
      "detailedFlights"
   );
   filteredFlights = new ObservableMap<string, boolean>(
      undefined,
      undefined,
      "filteredFlights"
   );
   selectedFlights = new ObservableMap<string, boolean>(
      undefined,
      undefined,
      "selectedFlights"
   );
   geoAreas = new Map<Icao, GeoCollection>();
   flights = new Map<Icao, FlightObj>();
   @observable newestPositionTimestamp = 0;
   viewer: Viewer;
   cameraEventDisposer: Event.RemoveCallback;
   @observable
   pointDisplayOptions: PointDisplayOptions = PointDisplayOptionDefaults;
   @observable
   selectedPointDisplayOptions: PointDisplayOptions = SelectedPointDisplayOptionDefaults;
   @observable
   trailDisplayOptions: TrailDisplayOptions = TrailDisplayOptionDefaults;
   @observable
   labelDisplayOptions: LabelDisplayOptions = LabelDisplayOptionDefaults;
   @observable isFiltered: boolean = false;

   constructor(viewer: Viewer) {
      this.viewer = viewer;
      this.cameraEventDisposer = viewer.camera.changed.addEventListener(
         this.handleCameraChange.bind(this)
      );
   }

   getCameraPositionGeohash(): string {
      const ellipsoid = this.viewer.scene.globe.ellipsoid;
      const cameraPosition = ellipsoid.cartesianToCartographic(
         this.viewer.camera.position
      );
      return Geohash.encode(
         (cameraPosition.latitude * 180) / Math.PI,
         (cameraPosition.longitude * 180) / Math.PI,
         3
      );
   }

   handleCameraChange() {
      const focusGeo = this.getCameraPositionGeohash();
      const newGeoResult = new Map<string, boolean>();
      newGeoResult.set(focusGeo, true);
      forEach(Geohash.neighbours(focusGeo), (neighbor) => {
         newGeoResult.set(neighbor, true);
      });
      this.updateDetailedFlights(newGeoResult);
   }

   getOrCreateGeoCollection(id: string): GeoCollection {
      let geo = this.geoAreas.get(id);
      if (!geo) {
         geo = new GeoCollection(id, this.viewer);
         this.geoAreas.set(id, geo);
      }
      return geo;
   }

   @action("routeUpdate")
   routeUpdate(messages: Message[]) {
      forEach(messages, (message) => {
         switch (message.type) {
            case "positionUpdate":
               const pUpdate = message as PositionUpdate;
               this.addOrUpdateFlight(pUpdate);
               break;
            case "demographicUpdate":
               const dUpdate = message as DemographicsUpdate;
               this.addDemographics(dUpdate);
               break;
         }
      });
      this.viewer.scene.requestRender();
   }

   @action("addOrUpdateFlight")
   addOrUpdateFlight(pos: PositionUpdate) {
      // this.flightPositions.set(pos.icao, pos.body);
      let flightRecord = this.flightData.get(pos.icao);
      if (flightRecord) {
         flightRecord.positions.push(pos.body);
      } else {
         flightRecord = newFlightRecord(pos.icao);
         flightRecord.positions.push(pos.body);
         this.flightData.set(pos.icao, flightRecord);
      }

      this.createFlightInGeo(flightRecord);

      this.updateLatestTimestamp(pos);
   }

   @action("createFlightInGeo")
   createFlightInGeo(fr: FlightRecord) {
      const geoColl = this.getOrCreateGeoCollection(fr.positions[0].geohash[0]);
      let thisFlight = this.flights.get(fr.icao);
      if (thisFlight && thisFlight.geoCollection !== geoColl) {
         thisFlight.destroy();
         thisFlight = undefined;
      }
      if (!thisFlight) {
         this.flights.set(fr.icao, new FlightObj(this, fr, fr.icao, geoColl));
      }
   }

   // @action('importTrack')
   // importTrack(track: FlightRecord[]){
   //     const icao = track[0].Icao;
   //     const newPositions:FlightPosition[] = [];
   //     track.forEach((t)=>{
   //         newPositions.push(t.Position[0])
   //     });
   //     this.flightPositions.set(icao,newPositions)
   // }

   @action("addDemographics")
   addDemographics(dem: DemographicsUpdate) {
      let flightRecord = this.flightData.get(dem.icao);
      if (!flightRecord) {
         flightRecord = newFlightRecord(dem.icao);
      }
      flightRecord.demographic.origin = dem.body.origin;
      flightRecord.demographic.destination = dem.body.destination;
      flightRecord.demographic.model = dem.body.model;
      if (has(aircraftModels, flightRecord.demographic.model)) {
         flightRecord.demographic.model =
            aircraftModels[flightRecord.demographic.model].name;
      }
      this.flightData.set(dem.icao, flightRecord);
   }

   @action("updateFlightData")
   updateFlightData(bootData: BootData) {
      forEach(bootData, (bd) => {
         this.flightData.set(bd.icao, bd);
         this.createFlightInGeo(bd);
      });
   }

   @action("updateFilteredFlights")
   updateFilteredFlights(filtered: Map<string, boolean>) {
      this.filteredFlights.replace(filtered);
   }

   @action("updateSelectedFlight")
   updateSelectedFlight(selected: Map<string, boolean>) {
      this.selectedFlights.replace(selected);
   }

   @action("updateDetailedFlights")
   updateDetailedFlights(selected: Map<string, boolean>) {
      this.detailedFlights.replace(selected);
   }

   @action("updateLatestTimestamp")
   updateLatestTimestamp(pos: PositionUpdate) {
      if (pos.body.timestamp > this.newestPositionTimestamp) {
         this.newestPositionTimestamp = pos.body.timestamp;
      }
   }

   @action("updatePointDisplay")
   updatePointDisplay(newOptions: PointDisplayOptionsUpdate) {
      if (newOptions.color) {
         newOptions.cesiumColor = Color.fromCssColorString(newOptions.color);
      }
      merge<PointDisplayOptions, PointDisplayOptionsUpdate>(
         this.pointDisplayOptions,
         newOptions
      );
   }

   @action("updateTrailDisplay")
   updateTrailDisplay(newOptions: TrailDisplayOptionsUpdate) {
      if (newOptions.color) {
         newOptions.cesiumColor = Color.fromCssColorString(newOptions.color);
      }
      merge<TrailDisplayOptions, TrailDisplayOptionsUpdate>(
         this.trailDisplayOptions,
         newOptions
      );
   }

   @action("updateLabelDisplay")
   updateLabelDisplay(newOptions: LabelDisplayOptionsUpdate) {
      if (newOptions.color) {
         newOptions.cesiumColor = Color.fromCssColorString(newOptions.color);
      }
      merge<LabelDisplayOptions, LabelDisplayOptionsUpdate>(
         this.labelDisplayOptions,
         newOptions
      );
   }

   @action("updateIsFiltered")
   updateIsFiltered(filterState: boolean) {
      this.isFiltered = filterState;
   }

   numberFlights(): number {
      return this.flightData.size;
   }

   numberGeos(): number {
      return this.geoAreas.size;
   }

   destroy() {
      this.flights.forEach((f) => f.destroy());
      this.geoAreas.forEach((f) => f.destroy());
      this.cameraEventDisposer();
   }
}
