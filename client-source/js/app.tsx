import 'cesiumSource/Widgets/widgets.css';
import {socket$, buffered$} from './dataStreams';
import updatePlanes from './updatePlanes';
import { viewer, planeData } from './globe';
import {size} from 'lodash-es'
import { interval, fromEvent } from 'rxjs';
import React from 'react';
import ReactDOM from 'react-dom';

let newestPositionTime:Date = new Date(2000,1,1);
const myInterval = interval(5000);
myInterval.subscribe(()=>{
  // console.log("asking for positions after", newestPositionTime)
  // @ts-ignore: we need to send a request here, not a FlightPosition
  socket$.next({lastReceived: newestPositionTime})
});

buffered$.subscribe((data) => {
  console.log(`Received ${size(data)} positions`);
  planeData.entities.suspendEvents();
  newestPositionTime = updatePlanes(planeData, data);
  // console.log("newest updated to:", newestPositionTime)
  planeData.entities.resumeEvents();
  viewer.scene.requestRender();
});

const App = ()=>(
    <div>Hello world...</div>
);

ReactDOM.render(<App />,document.getElementById('reactApp'));