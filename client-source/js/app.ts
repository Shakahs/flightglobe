import 'cesiumSource/Widgets/widgets.css';
import {socket$, buffered$} from './dataStreams';
import updatePlanes from './updatePlanes';
import { viewer, planeData } from './globe';
import {size} from 'lodash-es'
import { interval, fromEvent } from 'rxjs';

let newestPositionTime:Date = new Date(2000,1,1);
const myInterval = interval(1000);
myInterval.subscribe(()=>{
  // @ts-ignore: we need to send a request here, not a FlightPosition
  socket$.next({lastReceived: newestPositionTime})
});

buffered$.subscribe((data) => {
  console.log(`Received ${size(data)} positions`);
  planeData.entities.suspendEvents();
  newestPositionTime = updatePlanes(planeData, data);
  planeData.entities.resumeEvents();
  viewer.scene.requestRender();
});
