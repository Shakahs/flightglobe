import 'cesium/Source/Widgets/widgets.css';
import dataStream$ from './dataStreams';
import updatePlanes from './updatePlanes';
import { planeData } from './cesium';

dataStream$.subscribe((data) => {
  console.log('position update received');
  planeData.entities.suspendEvents();
  updatePlanes(planeData, data);
  planeData.entities.resumeEvents();
});
