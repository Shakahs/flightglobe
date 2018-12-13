import * as Cesium from 'cesium';
import axios from 'axios';
import {viewer} from './initializeGlobe'

// import {Viewer} from 'cesium';
// import {CustomDataSource} from 'cesium';

const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
// @ts-ignore: the installed Cesium type definition is incorrect (@types/cesium 1.47.3),
// setInputAction will pass an argument (click in this case)
handler.setInputAction(async (click) => {
  const pickedObject:Cesium.PointPrimitive | Cesium.Polyline = viewer.scene.pick(click.position);
  if (pickedObject) {
    console.log(`picked object id: ${pickedObject.id}`)
    // const trackURL = `/track?icao=${ pickedObject.id._id }`;
    // console.log(trackURL);
    // const {data} = await axios.get(trackURL);
    // console.log(data);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

//percentage of change to trigger camera changed event. lowered to make camera events more responsive
viewer.camera.percentageChanged = 0.3;

export { viewer };
