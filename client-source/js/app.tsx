import 'cesiumSource/Widgets/widgets.css';
import {socket$, buffered$} from './api/webSocket';
import { viewer } from './setup';
import {size,forEach} from 'lodash-es'
import { interval } from 'rxjs';
import React from 'react';
import ReactDOM from 'react-dom';
import {FlightPosition, FlightMap, PositionUpdate, DemographicsUpdate, GeoMap} from "./types";
import {FlightStore} from './state'

const flightStore = new FlightStore(viewer);

let newestPositionTimestamp = 0;

const pollInterval = interval(5000);
pollInterval.subscribe(()=>{
  // console.log("asking for positions after", newestPositionTime)
  // @ts-ignore: we need to send a request here, not a FlightPosition
  socket$.next({lastReceivedTimestamp: flightStore.newestPositionTimestamp})
});

buffered$.subscribe((messages) => {
    console.log(size(messages), "messages received");

    // const affectedGeos = new Set();
    forEach(messages, (message)=>{
      switch (message.type) {
          case "positionUpdate":
            const pUpdate = message as PositionUpdate;
            flightStore.addOrUpdateFlight(pUpdate);
            break;
          case "demographicUpdate":
            const dUpdate = message as DemographicsUpdate;
            flightStore.addDemographics(dUpdate);
            break;
      }
    });

    viewer.scene.requestRender();

    // console.log(`${affectedGeos.size} geohashed datasources affected`);
    // affectedGeos.clear();
});

setInterval(()=>{
    console.log(`${flightStore.numberFlights()} flights in memory`)
    console.log(`${flightStore.numberGeos()} geohash datasources`)
    // console.log(flightData)
}, 15000);

// const App = ()=>(
//     <div>Hello world...</div>
// );
//
// ReactDOM.render(<App />,document.getElementById('reactApp'));