import "core-js/stable";
import "regenerator-runtime/runtime";
import "cesiumSource/Widgets/widgets.css";
import * as React from "react";
import ReactDOM from "react-dom";
import { FlightStore } from "../flightStore";
// import applyClickHandler from "../globe/clickHandler";
import App from "./app";
import WebsocketHandler from "../websocketHandler";
import "../styles.scss";
import { Globe } from "../globe/globe";
import { DeepstreamClient } from "@deepstream/client";
import { REMOTE_WINS } from "@deepstream/client/dist/record/merge-strategy";
import {
   FlightDemographics,
   FlightPosition,
   Icao,
   PositionUpdate
} from "../types";
import { Record } from "@deepstream/client/dist/record/record";
import { BootData } from "../../../deepstream/deepstreamPusher";

const globe = new Globe("cesiumContainer");
const flightStore = new FlightStore(globe.viewer);
const routeUpdate = flightStore.routeUpdate.bind(flightStore);
import { debounce, forEach, throttle } from "lodash-es";
import { queue } from "d3-queue";
// const wsh = new WebsocketHandler(routeUpdate);
// applyClickHandler(viewer, flightStore)

// setInterval(() => {
//    // @ts-ignore: we need to send a request here, not a FlightPosition
//    wsh.send({ lastReceivedTimestamp: flightStore.newestPositionTimestamp });
// }, 5000);

ReactDOM.render(
   <App globe={globe} flightStore={flightStore} />,
   document.getElementById("reactApp")
);

const ds = new DeepstreamClient("localhost:6020", {
   mergeStrategy: REMOTE_WINS
});

interface DSFlightRecord {
   Icao: string;
   Position: FlightPosition;
   Demographic: FlightDemographics;
   Time?: Date;
}

const subscribers = new Map<string, any>();

class Subber {
   icao: string;
   record: Record;
   routeUpdate: any;

   constructor(icao: string, record, updater) {
      this.icao = icao;
      this.record = record;
      this.routeUpdate = updater;

      this.record.subscribe(
         "Position",
         (p: FlightPosition) => {
            const pUpdate: PositionUpdate = {
               type: "positionUpdate",
               icao: this.icao,
               body: {
                  timestamp: p.timestamp,
                  altitude: p.altitude,
                  latitude: p.latitude,
                  longitude: p.longitude,
                  heading: p.heading,
                  geohash: p.geohash
               }
            };
            // console.log(pUpdate);
            routeUpdate([pUpdate]);
         },
         false
      );
   }
}

const getData = async () => {
   //wait until tiles are loaded
   await new Promise((resolve) => {
      const poller = setInterval(() => {
         //@ts-ignore tilesLoaded is missing from TS definition
         if (globe.viewer.scene.globe.tilesLoaded) {
            clearInterval(poller);
            resolve();
         }
      }, 1000);
   });

   // const bootDataUntyped = await ds.record.snapshot("bootData");
   const bootData = ((await ds.record.snapshot(
      "bootData"
   )) as unknown) as BootData;
   // const bootMap = new Map<string, FlightRecord>(Object.entries(bootData));
   // flightStore.updateFlightData(bootData);

   const q = queue(500);
   const debouncedRefresh = throttle(() => {
      globe.viewer.scene.requestRender();
   }, 1000);

   forEach(bootData, (bd) => {
      q.defer((cb) => {
         flightStore.addOrUpdateFlight({
            type: "positionUpdate",
            icao: bd.icao,
            body: bd.positions[0]
         });
         debouncedRefresh();
         setTimeout(() => {
            cb();
         }, 1000);
      });
   });

   q.await((err) => {
      console.log("initial data load finished");
      const icaoList = ds.record.getList("icaoList");
      icaoList.subscribe((icaoList: Icao[]) => {
         icaoList.forEach((icao) => {
            if (!subscribers.has(icao)) {
               const record = ds.record.getRecord(icao);
               subscribers.set(icao, new Subber(icao, record, routeUpdate));
               // console.log(`Created new subber for ${icao}`);
            }
         });
      });
   });
};

ds.login().then(getData);
