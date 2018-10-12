import * as Cesium from 'cesium';

// import {Viewer} from 'cesium';
// import {CustomDataSource} from 'cesium';
import axios from 'axios';

// import {ScreenSpaceEventHandler} from 'cesium';
// import {ScreenSpaceEventType} from 'cesium';
import loadAirports from './airports';

const planeData:Cesium.CustomDataSource = new Cesium.CustomDataSource('planes');
const airportDataRaw = require('../resources/airports.json');
const airportData = new Cesium.CustomDataSource('airports');
loadAirports(airportData, airportDataRaw);

const viewer = new Cesium.Viewer('cesiumContainer', {
  animation: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  sceneModePicker: false,
  selectionIndicator: true,
  timeline: false,
  navigationHelpButton: false,
  scene3DOnly: true,
  // imageryProvider,
  // terrainProvider,
  requestRenderMode: true,
  // shouldAnimate: true,
  // automaticallyTrackDataSourceClocks: false,
});

viewer.scene.debugShowFramesPerSecond = true;
viewer.dataSources.add(planeData);
viewer.dataSources.add(airportData);

// @ts-ignore: using canvas here is correct, the installed Cesium type definition is incorrect (@types/cesium 1.47.3)
const handler = new ScreenSpaceEventHandler(viewer.scene.canvas); //ts-ignore
handler.setInputAction(async (click) => {
  const pickedObject = viewer.scene.pick(click.position);
  if (pickedObject) {
    const trackURL = `/track?icao=${ pickedObject.id._id }`;
    console.log(trackURL);
    const {data} = await axios.get(trackURL);
    console.log(data);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

export { viewer, planeData, airportData };
