import 'cesiumSource/Widgets/widgets.css';
import {socket$, buffered$} from './dataStreams';
import updatePlane from './updatePlanes';
import { viewer, cesiumPlaneDataSource } from './globe';
import {size,forEach} from 'lodash-es'
import { interval } from 'rxjs';
import React from 'react';
import ReactDOM from 'react-dom';
import {FlightPosition, FlightMap, PositionUpdate} from "./types";

const flightData:FlightMap = new Map();

let newestPositionTime:Date = new Date(2000,1,1);
const pollInterval = interval(5000);
pollInterval.subscribe(()=>{
  // console.log("asking for positions after", newestPositionTime)
  // @ts-ignore: we need to send a request here, not a FlightPosition
  socket$.next({lastReceived: newestPositionTime})
});

const handlePositionUpdate = (position: FlightPosition)=>{
    // console.log(`Received ${size(data)} positions`);
    newestPositionTime = updatePlane(flightData, cesiumPlaneDataSource, position);
    // console.log("newest updated to:", newestPositionTime)
};

buffered$.subscribe((messages) => {
    cesiumPlaneDataSource.entities.suspendEvents();
    forEach(messages, (message)=>{
      switch (message.type) {
          case "positionUpdate":
            handlePositionUpdate(message.body)
      }
    });
    cesiumPlaneDataSource.entities.resumeEvents();
    viewer.scene.requestRender();
});

const App = ()=>(
    <div>Hello world...</div>
);

ReactDOM.render(<App />,document.getElementById('reactApp'));