import 'cesiumSource/Widgets/widgets.css';
import dataStream$ from './dataStreams';
import updatePlanes from './updatePlanes';
import { viewer, planeData } from './globe';
import {size} from 'lodash-es'

dataStream$.subscribe((data) => {
  console.log(`Received ${size(data)} positions`);
  planeData.entities.suspendEvents();
  updatePlanes(planeData, data);
  planeData.entities.resumeEvents();
  viewer.scene.requestRender();
});
