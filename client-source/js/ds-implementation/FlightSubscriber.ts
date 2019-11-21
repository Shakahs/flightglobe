import { DeepstreamClient } from "@deepstream/client";
import { FlightDemographics, FlightPosition } from "../../../lib/types";
import { Icao } from "../types";
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
import { ObservableArray } from "mobx/lib/types/observablearray";
import { generateTrackFullKey } from "../../../lib/constants";

require("./mobxConfig");

interface FlightRenderParams {
   position: Cartesian3;
   demographic: FlightDemographics | undefined;
   detailSelected: boolean;
   trackFull: FlightPosition[];
}

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

   constructor(
      dsConn: DeepstreamClient,
      icao: Icao,
      pos: FlightPosition,
      requestRender: () => void,
      demographics: DemographicsManager
   ) {
      this.dsConn = dsConn;
      this.icao = icao;
      // this.gm = gm;
      this.position = pos;
      this.requestRender = requestRender;
      this.demographicsManager = demographics;

      const renderRequester = reaction(
         () => this.renderParams,
         () => {
            this.needsRender = true;
            this.requestRender();
         },
         {
            fireImmediately: true
         }
      );

      const trackFullRequester = reaction(
         () => this.isDetailSelected,
         () => {
            if (this.isDetailSelected) {
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

   @computed get isDetailSelected(): boolean {
      return this.demographicsManager.detailedFlights.has(
         this.position.geohash
      );
   }

   @computed get renderParams(): FlightRenderParams {
      return {
         position: this.cartesianPosition,
         demographic: this.demographic,
         detailSelected: this.isDetailSelected,
         trackFull: this.trackFull
      };
   }

   destroy() {
      each(this.disposers, (d) => {
         d();
      });
      this.unsubscribeTrackFull();
   }
}
