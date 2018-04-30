import 'cesium/Source/Widgets/widgets.css';
import dataStream$ from './dataStreams';
import updatePlanes from './updatePlanes';
import { planeData } from './cesium';

const airports = require('../resources/airports.json');

dataStream$.subscribe((data) => {
  planeData.entities.suspendEvents();
  updatePlanes(planeData, data);
  planeData.entities.resumeEvents();
});
