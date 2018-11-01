import 'cesiumSource/Widgets/widgets.css';
import {socket$, buffered$} from './dataStreams';
import {updatePlane, updateDemographics} from './manageData';
import { viewer, cesiumPlaneDataSource } from './globe';
import {size,forEach} from 'lodash-es'
import { interval } from 'rxjs';
import React from 'react';
import ReactDOM from 'react-dom';
import {FlightPosition, FlightMap, PositionUpdate, DemographicsUpdate} from "./types";

const flightData:FlightMap = new Map();

let newestPositionTimestamp = 0;
const pollInterval = interval(5000);
pollInterval.subscribe(()=>{
  // console.log("asking for positions after", newestPositionTime)
  // @ts-ignore: we need to send a request here, not a FlightPosition
  socket$.next({lastReceivedTimestamp: newestPositionTimestamp})
});

buffered$.subscribe((messages) => {
    console.log(size(messages), "messages received");
    cesiumPlaneDataSource.entities.suspendEvents();
    forEach(messages, (message)=>{
      switch (message.type) {
          case "positionUpdate":
            newestPositionTimestamp = updatePlane(flightData, cesiumPlaneDataSource, message);
            break;
          case "demographicUpdate":
            updateDemographics(flightData, message);
            break;
      }
    });
    cesiumPlaneDataSource.entities.resumeEvents();
    viewer.scene.requestRender();
});

setInterval(()=>{
    console.log(`${flightData.size} flights in memory`)
    // console.log(flightData)
}, 15000);

const App = ()=>(
    <div>Hello world...</div>
);

ReactDOM.render(<App />,document.getElementById('reactApp'));