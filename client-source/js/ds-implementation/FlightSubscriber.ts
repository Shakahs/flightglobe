import { DeepstreamClient } from "@deepstream/client";
import { FlightDemographics, FlightPosition, Icao } from "../../../lib/types";
import {
   action,
   computed,
   IReactionDisposer,
   observable,
   reaction
} from "mobx";
import { Cartesian3 } from "cesium";
import { convertPositionToCartesian } from "../ws-implementation/utility";
import { each } from "lodash";
import { DemographicsManager } from "./DemographicsManager";
import { generateTrackFullKey } from "../../../lib/constants";
import { DisplayPreferences } from "./DisplayPreferences";

require("./mobxConfig");

export class FlightSubscriber {
   private readonly dsConn: DeepstreamClient;
   readonly icao: Icao;
   // gm: GeoManager;
   private disposers: Array<IReactionDisposer>;
   @observable.shallow position: FlightPosition;
   readonly requestRender: () => void;
   needsRender: boolean = false;
   demographicsManager: DemographicsManager;
   dsTrackFull;
   @observable.shallow trackFull: FlightPosition[] = [];
   displayPreferences: DisplayPreferences;

   constructor(
      dsConn: DeepstreamClient,
      icao: Icao,
      pos: FlightPosition,
      requestRender: () => void,
      demographics: DemographicsManager,
      displayPreferences: DisplayPreferences
   ) {
      this.dsConn = dsConn;
      this.icao = icao;
      // this.gm = gm;
      this.position = pos;
      this.requestRender = requestRender;
      this.demographicsManager = demographics;
      this.displayPreferences = displayPreferences;

      const renderRequester = reaction(
         () => ({
            cartesianPosition: this.cartesianPosition,
            demographic: this.demographic,
            trackFull: this.trackFull,
            shouldDisplay: this.shouldDisplay,
            shouldDisplayDetailed: this.shouldDisplayDetailed
         }),
         () => {
            this.needsRender = true;
            this.requestRender();
         },
         {
            fireImmediately: true
         }
      );

      const trackFullRequester = reaction(
         () => ({
            shouldDisplay: this.shouldDisplay,
            shouldDisplayDetailed: this.shouldDisplayDetailed
         }),
         () => {
            if (this.shouldDisplay && this.shouldDisplayDetailed) {
               this.subscribeTrackFull();
            } else {
               this.unsubscribeTrackFull();
            }
         }
      );

      this.disposers = [renderRequester, trackFullRequester];
   }

   subscribeTrackFull() {
      if (!this.dsTrackFull) {
         this.dsTrackFull = this.dsConn.record.getRecord(
            generateTrackFullKey(this.icao)
         );
         this.dsTrackFull.subscribe((fullTrack) => {
            this.updateTrackFull(fullTrack);
         });
      }
   }

   unsubscribeTrackFull() {
      if (this.dsTrackFull) {
         this.dsTrackFull.discard();
         this.dsTrackFull = null;
      }
   }

   @action
   updateTrackFull(track: FlightPosition[]) {
      this.trackFull = track;
   }

   @action
   updatePosition(newPos: FlightPosition) {
      this.position = newPos;
   }

   @computed get cartesianPosition(): Cartesian3 {
      return convertPositionToCartesian(this.position);
   }

   @computed get demographic(): FlightDemographics | undefined {
      return this.demographicsManager.demographicsMap.get(this.icao);
   }

   // essential data - selection status

   @computed get isDetailSelected(): boolean {
      return this.demographicsManager.detailedFlights.has(
         this.position.geohash
      );
   }

   @computed get isFilterSelected(): boolean {
      return this.demographicsManager.filteredFlights.has(this.icao); // filter active, check the filter result
   }

   @computed get isSelected(): boolean {
      return this.demographicsManager.selectedFlights.has(this.icao);
   }

   // essential data - visibility

   @computed get shouldDisplay(): boolean {
      if (this.isSelected) {
         return true;
      }
      if (this.demographicsManager.isFiltered) {
         return this.isSelected || this.isFilterSelected;
      }
      return true;
   }

   @computed get shouldDisplayDetailed(): boolean {
      return this.isSelected || this.isDetailSelected;
   }

   @computed get shouldDisplayTrail(): boolean {
      if (this.isSelected) {
         return true;
      }
      return this.displayPreferences.showNearbyTrails && this.isCameraAdjacent;
   }

   destroy() {
      each(this.disposers, (d) => {
         d();
      });
      this.unsubscribeTrackFull();
   }
}
