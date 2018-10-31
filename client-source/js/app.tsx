import 'cesiumSource/Widgets/widgets.css';
import {socket$, buffered$} from './dataStreams';
import updatePlanes from './updatePlanes';
import { viewer, cesiumPlaneDataSource } from './globe';
import {size} from 'lodash-es'
import { interval } from 'rxjs';
import React from 'react';
import ReactDOM from 'react-dom';
import {PlaneMap} from "./types";

const planeData:PlaneMap = new Map();

let newestPositionTime:Date = new Date(2000,1,1);
const pollInterval = interval(5000);
pollInterval.subscribe(()=>{
  // console.log("asking for positions after", newestPositionTime)
  // @ts-ignore: we need to send a request here, not a FlightPosition
  socket$.next({lastReceived: newestPositionTime})
});

buffered$.subscribe((data) => {
  console.log(`Received ${size(data)} positions`);
  cesiumPlaneDataSource.entities.suspendEvents();
  newestPositionTime = updatePlanes(planeData, cesiumPlaneDataSource, data);
  // console.log("newest updated to:", newestPositionTime)
  cesiumPlaneDataSource.entities.resumeEvents();
  viewer.scene.requestRender();
});

const App = ()=>(
    <div>Hello world...</div>
);

ReactDOM.render(<App />,document.getElementById('reactApp'));