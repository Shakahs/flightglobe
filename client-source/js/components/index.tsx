import "@babel/polyfill";
import 'cesiumSource/Widgets/widgets.css';
import {buffered$, socket$} from '../api/webSocket';
import {viewer} from '../globe';
import {forEach, size} from 'lodash-es'
import {interval} from 'rxjs';
import * as React from 'react';
import ReactDOM from 'react-dom';
import {DemographicsUpdate, PositionUpdate} from "../types";
import {FlightStore} from '../flightStore'
import applyClickHandler from "../globe/clickHandler";
import App from "./app";
import WebsocketHandler from "../websocketHandler";
import '../styles.scss'

const flightStore = new FlightStore(viewer);
const wsh = new WebsocketHandler(flightStore.routeUpdate.bind(flightStore));
applyClickHandler(viewer, flightStore)

const pollInterval = interval(5000);
pollInterval.subscribe(()=>{
  // console.log("asking for positions after", newestPositionTime)
  // @ts-ignore: we need to send a request here, not a FlightPosition
  wsh.send({lastReceivedTimestamp: flightStore.newestPositionTimestamp})
});

// buffered$.subscribe((messages) => {
//     console.log(size(messages), "messages received");
//
//     // const affectedGeos = new Set();
//     forEach(messages, (message)=>{
//       switch (message.type) {
//           case "positionUpdate":
//             const pUpdate = message as PositionUpdate;
//             flightStore.addOrUpdateFlight(pUpdate);
//             break;
//           case "demographicUpdate":
//             const dUpdate = message as DemographicsUpdate;
//             flightStore.addDemographics(dUpdate);
//             break;
//       }
//     });
//
//     viewer.scene.requestRender();
//
//     // console.log(`${affectedGeos.size} geohashed datasources affected`);
//     // affectedGeos.clear();
// });

setInterval(()=>{
    console.log(`${flightStore.numberFlights()} flights in memory`)
    console.log(`${flightStore.numberGeos()} geohash datasources`)
    // console.log(flightData)
}, 15000);

ReactDOM.render(<App flightStore={flightStore}/>,document.getElementById('reactApp'));