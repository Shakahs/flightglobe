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

require("./mobxConfig");

export class GeoManager {
   dsConn: DeepstreamClient;
   dsRecord;
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
   constructor(
      dsConn: DeepstreamClient,
      geohash: Geohash,
      demographics: DemographicsManager,
      displayPreferences: DisplayPreferences,
      globe?: Globe | null
   ) {
      this.dsConn = dsConn;
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
   }

   subscribe() {
      this.dsRecord = this.dsConn.record.getRecord(
         generateGeohashedPositionsKey(this.geohash)
      );
      this.dsRecord.subscribe(this.reconcile.bind(this));
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
               this.dsConn,
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
      this.dsRecord?.discard();
      this.flightSubscriberMap.forEach((f) => f.destroy());
      this.cph?.destroy();
      this.cph = null;
   }
}
