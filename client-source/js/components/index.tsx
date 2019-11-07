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

const globe = new Globe("cesiumContainer");
const flightStore = new FlightStore(globe.viewer);
const routeUpdate = flightStore.routeUpdate.bind(flightStore);
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

const getData = () => {
   const icaoList = ds.record.getList("icaoList");
   icaoList.subscribe((icaoList: Icao[]) => {
      icaoList.forEach(async (icao) => {
         const record = ds.record.getRecord(icao);
         await record.whenReady();
         const dsf: DSFlightRecord = record.get();
         // console.log(dsf);
         const pUpdate: PositionUpdate = {
            type: "positionUpdate",
            icao: dsf.Icao,
            body: {
               timestamp: dsf.Position.timestamp,
               altitude: dsf.Position.altitude,
               latitude: dsf.Position.latitude,
               longitude: dsf.Position.longitude,
               heading: dsf.Position.heading,
               geohash: dsf.Position.geohash
            }
         };

         routeUpdate([pUpdate]);
      });
   });
};

ds.login().then(getData);
