import * as Cesium from 'cesium';

// import {Viewer} from 'cesium';
// import {CustomDataSource} from 'cesium';
import axios from 'axios';

// import {ScreenSpaceEventHandler} from 'cesium';
// import {ScreenSpaceEventType} from 'cesium';
// import loadAirports from './airports';

const cesiumPlaneDataSource:Cesium.CustomDataSource = new Cesium.CustomDataSource('planes');
// const airportDataRaw = require('../resources/airports.json');
// const airportData = new Cesium.CustomDataSource('airports');
// loadAirports(airportData, airportDataRaw);

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
  maximumRenderTimeChange : Infinity,
  // targetFrameRate: 30
    // shouldAnimate: true,
  // automaticallyTrackDataSourceClocks: false,
});

// viewer.scene.debugShowFramesPerSecond = true;
viewer.dataSources.add(cesiumPlaneDataSource);
// viewer.dataSources.add(airportData);
// viewer.clock.shouldAnimate = false;
// viewer.useDefaultRenderLoop = false;
//
// function myOwnRenderLoop() {
//     viewer.resize();
//     viewer.render();
// }
//
// window.setInterval(myOwnRenderLoop, 500);


const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
// @ts-ignore: the installed Cesium type definition is incorrect (@types/cesium 1.47.3),
// setInputAction will pass an argument (click in this case)
handler.setInputAction(async (click) => {
  const pickedObject = viewer.scene.pick(click.position);
  if (pickedObject) {
    const trackURL = `/track?icao=${ pickedObject.id._id }`;
    console.log(trackURL);
    const {data} = await axios.get(trackURL);
    console.log(data);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

export { viewer, cesiumPlaneDataSource };
