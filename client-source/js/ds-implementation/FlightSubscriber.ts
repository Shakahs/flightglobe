import { DeepstreamClient } from "@deepstream/client";
import { FlightPosition } from "../../../lib/types";
import { Icao } from "../types";
import { action, autorun, computed, IReactionDisposer, observable } from "mobx";
import { Cartesian3 } from "cesium";
import { convertPositionToCartesian } from "../ws-implementation/utility";
require("./mobxConfig");

export class FlightSubscriber {
   private readonly dsConn: DeepstreamClient;
   private readonly icao: Icao;
   // gm: GeoManager;
   // private disposers: Array<IReactionDisposer>;
   @observable private position: FlightPosition;
   private readonly requestRender: () => void;

   constructor(
      dsConn: DeepstreamClient,
      icao: Icao,
      pos: FlightPosition,
      requestRender: () => void
   ) {
      this.dsConn = dsConn;
      this.icao = icao;
      // this.gm = gm;
      this.position = pos;
      this.requestRender = requestRender;

      // const pointUpdater = autorun(
      //    () => {
      //       const newPosition = this.cartesianPosition;
      //       if (newPosition) {
      //          this.requestRender();
      //       }
      //    },
      //    { name: "pointUpdater" }
      // );
      // this.disposers = [pointUpdater];
   }

   @action
   updatePosition(newPos: FlightPosition) {
      this.position = newPos;
   }

   @computed get cartesianPosition(): Cartesian3 {
      return convertPositionToCartesian(this.position);
   }

   destroy() {}
}
