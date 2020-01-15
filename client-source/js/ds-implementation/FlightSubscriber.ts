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
import { each } from "lodash";
import { DemographicsManager } from "./DemographicsManager";
import { generateTrackFullKey } from "../../../lib/constants";
import { DisplayPreferences } from "./DisplayPreferences";
import { Globe } from "../globe/globe";
import { convertPositionToCartesian } from "./utility";
import { ajax, AjaxResponse } from "rxjs/ajax";
import polling from "rx-polling";
import { Observable } from "rxjs";
import { Subscription } from "rxjs/src/internal/Subscription";

require("./mobxConfig");

export class FlightSubscriber {
   readonly icao: Icao;
   // gm: GeoManager;
   private disposers: Array<IReactionDisposer>;
   @observable.ref position: FlightPosition;
   readonly requestRender: () => void;
   needsRender: boolean = false;
   demographicsManager: DemographicsManager;
   polling: Observable<AjaxResponse>;
   pollingSub;
   @observable.ref trackFull: FlightPosition[] = [];
   displayPreferences: DisplayPreferences;
   globe: Globe | undefined;

   constructor(
      icao: Icao,
      pos: FlightPosition,
      requestRender: () => void,
      demographics: DemographicsManager,
      displayPreferences: DisplayPreferences,
      globe?: Globe
   ) {
      this.icao = icao;
      // this.gm = gm;
      this.position = pos;
      this.requestRender = requestRender;
      this.demographicsManager = demographics;
      this.displayPreferences = displayPreferences;
      this.globe = globe;

      const renderRequester = reaction(
         () => ({
            cartesianPosition: this.cartesianPosition,
            demographic: this.demographic,
            trackFull: this.trackFull,
            shouldDisplay: this.shouldDisplay,
            shouldDisplayLabel: this.shouldDisplayLabel,
            shouldDisplayTrack: this.shouldDisplayTrack,
            pointDisplayOptions: this.displayPreferences.pointDisplayOptions,
            trackDisplayOptions: this.displayPreferences.trackDisplayOptions,
            labelDisplayOptions: this.displayPreferences.labelDisplayOptions
            // cameraHeight: this.globe?.cameraPosition.height
         }),
         () => {
            this.needsRender = true;
            this.requestRender();
         },
         {
            fireImmediately: true,
            delay: 500
         }
      );

      const trackRequest = ajax({
         url: `${window.location.origin}/api/track/${this.icao}`
      });
      this.polling = polling(trackRequest, { interval: 10000 });

      const trackFullRequester = reaction(
         () => this.shouldFetchTrack,
         (shouldFetchTrack) => {
            if (shouldFetchTrack) {
               this.subscribeTrackFull();
            } else {
               this.unsubscribeTrackFull();
            }
         }
      );

      // this.disposers = [renderRequester, trackFullRequester];
      this.disposers = [renderRequester];
   }

   subscribeTrackFull() {
      if (!this.pollingSub) {
         this.pollingSub = this.polling.subscribe((res) => {
            this.updateTrackFull(res.response);
         });
      }
   }

   unsubscribeTrackFull() {
      this.pollingSub?.unsubscribe();
      this.pollingSub = undefined;
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

   @computed get isCameraAdjacent(): boolean {
      return this.demographicsManager.cameraAdjacentFlights.has(
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
         return this.isFilterSelected;
      }
      return true;
   }

   @computed get shouldFetchTrack(): boolean {
      if (!this.shouldDisplay) {
         return false;
      }
      if (
         this.displayPreferences.trackDisplayOptions.showWhenSelected &&
         this.isSelected
      ) {
         return true;
      }
      return (
         this.displayPreferences.trackDisplayOptions.showWhenCameraAdjacent &&
         this.isCameraAdjacent
      );
   }

   @computed get shouldDisplayTrack(): boolean {
      return this.shouldFetchTrack && this.trackFull.length >= 2;
   }

   @computed get shouldDisplayLabel(): boolean {
      if (!this.shouldDisplay) {
         return false;
      }
      if (!this.demographic) {
         return false;
      }
      if (
         (this.globe?.cameraPosition.height || 0) > //default to 0 height if globe is undefined
         this.displayPreferences.labelDisplayOptions.maxCameraHeight
      ) {
         return false;
      }
      if (
         this.displayPreferences.labelDisplayOptions.showWhenSelected &&
         this.isSelected
      ) {
         return true;
      }
      return (
         this.displayPreferences.labelDisplayOptions.showWhenCameraAdjacent &&
         this.isCameraAdjacent
      );
   }

   destroy() {
      each(this.disposers, (d) => {
         d();
      });
      // this.unsubscribeTrackFull();
   }
}
