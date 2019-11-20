import { DeepstreamClient } from "@deepstream/client";
import { FlightPosition } from "../../../lib/types";
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

require("./mobxConfig");

interface FlightRenderParams {
   position: Cartesian3;
}

export class FlightSubscriber {
   private readonly dsConn: DeepstreamClient;
   readonly icao: Icao;
   // gm: GeoManager;
   private disposers: Array<IReactionDisposer>;
   @observable private position: FlightPosition;
   readonly requestRender: () => void;
   needsRender: boolean = false;
   demographics: DemographicsManager;

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
      this.demographics = demographics;

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

      // const pointUpdater = autorun(
      //    () => {
      //       const newPosition = this.cartesianPosition;
      //       if (newPosition) {
      //          this.requestRender();
      //       }
      //    },
      //    { name: "pointUpdater" }
      // );

      this.disposers = [renderRequester];
   }

   @action
   updatePosition(newPos: FlightPosition) {
      this.position = newPos;
   }

   @computed get cartesianPosition(): Cartesian3 {
      return convertPositionToCartesian(this.position);
   }

   @computed get renderParams(): FlightRenderParams {
      return { position: this.cartesianPosition };
   }

   destroy() {
      each(this.disposers, (d) => {
         d();
      });
   }
}
