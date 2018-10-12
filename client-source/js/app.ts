
import 'cesiumSource/Widgets/widgets.css';
import dataStream$ from './dataStreams';
import updatePlanes from './updatePlanes';
import { viewer, planeData } from './globe';

dataStream$.subscribe((data) => {
  console.log('position update received');
  planeData.entities.suspendEvents();
  updatePlanes(planeData, data);
  planeData.entities.resumeEvents();
  viewer.scene.requestRender();
});
