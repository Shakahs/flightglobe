import { DeepstreamClient } from "@deepstream/client";
import { Geohash, GeoPositionList } from "../../../lib/types";
import { FlightSubscriber } from "./FlightSubscriber";
import { debounce, forEach, keys, without } from "lodash";
import { CesiumPrimitiveHandler } from "./CesiumPrimitiveHandler";
import { Viewer } from "cesium";
import { FlightSubscriberMap } from "./types";
import { generateGeohashedPositionsKey } from "../../../lib/constants";
import { DemographicsManager } from "./DemographicsManager";
import { DisplayPreferences } from "./DisplayPreferences";
import { Globe } from "../globe/globe";
import { GeoManagerCreator } from "./GeoManagerCreator";
import { autorun, computed, reaction } from "mobx";

require("./mobxConfig");

export class GeoManager {
   geohash: Geohash;
   // flightPositions = new ObservableMap<Icao, FlightPosition>(
   //    undefined,
   //    undefined,
   //    "flightPositions"
   // );
   flightSubscriberMap: FlightSubscriberMap;
   debouncedRender: () => void;
   cph: CesiumPrimitiveHandler | null = null;
   demographics: DemographicsManager;
   displayPreferences: DisplayPreferences;
   globe: Globe | undefined;
   gmc: GeoManagerCreator;
   constructor(
      gmc: GeoManagerCreator,
      geohash: Geohash,
      demographics: DemographicsManager,
      displayPreferences: DisplayPreferences,
      globe?: Globe | null
   ) {
      this.gmc = gmc;
      this.geohash = geohash;
      this.demographics = demographics;
      this.flightSubscriberMap = new Map();
      this.debouncedRender = debounce(this.render.bind(this), 250, {
         maxWait: 500
      });
      if (globe) {
         this.globe = globe;
         this.cph = new CesiumPrimitiveHandler(globe.viewer);
      }
      this.displayPreferences = displayPreferences;
      this.updateOrCreateFlightSubscriber = this.updateOrCreateFlightSubscriber.bind(
         this
      );

      reaction(
         () => ({
            currentDataSet: this.currentDataSet
         }),
         () => {
            if (this.currentDataSet) {
               this.reconcile(this.currentDataSet);
            }
         }
      );
   }

   @computed
   get currentDataSet(): GeoPositionList | undefined {
      return this.gmc.geoCollectedPositions.get(this.geohash);
   }

   reconcile(update: GeoPositionList) {
      //create or update FlightSubscribers under the respective ICAO key
      forEach(update.flights, this.updateOrCreateFlightSubscriber);

      // the provided flight position update is our source of truth,
      // so subtract the flight position keys from our current flightSubscriberMap,
      // the resulting keys are flights that need to be deleted
      without(
         Array.from(this.flightSubscriberMap.keys()),
         ...keys(update.flights)
      ).forEach((d) => {
         this.flightSubscriberMap.get(d)?.destroy();
         this.flightSubscriberMap.delete(d);
      });
   }

   updateOrCreateFlightSubscriber(fpos, icao) {
      const foundFlight = this.flightSubscriberMap.get(icao);
      if (foundFlight) {
         foundFlight.updatePosition(fpos);
      } else {
         this.flightSubscriberMap.set(
            icao,
            new FlightSubscriber(
               icao,
               fpos,
               this.debouncedRender,
               this.demographics,
               this.displayPreferences,
               this.globe
            )
         );
      }
   }

   render() {
      this.cph?.render(this.flightSubscriberMap);
   }

   destroy() {
      this.flightSubscriberMap.forEach((f) => f.destroy());
      this.cph?.destroy();
      this.cph = null;
   }
}
