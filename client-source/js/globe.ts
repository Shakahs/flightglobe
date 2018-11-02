import * as Cesium from 'cesium';

// import {Viewer} from 'cesium';
// import {CustomDataSource} from 'cesium';
import axios from 'axios';
import {keyBy} from "lodash-es";

// import {ScreenSpaceEventHandler} from 'cesium';
// import {ScreenSpaceEventType} from 'cesium';
import loadAirports from './airports';
import {AirportData} from "./types";

const cesiumPlaneDataSource:Cesium.CustomDataSource = new Cesium.CustomDataSource('planes');
const airportDataRaw:AirportData = require('../resources/airports.json');
const airportData = keyBy<AirportData>(airportDataRaw, (airport)=>(airport.iata))
const airportDataSource = new Cesium.CustomDataSource('airports');
loadAirports(airportDataSource, airportDataRaw);

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
viewer.dataSources.add(cesiumPlaneDataSource);
viewer.dataSources.add(airportDataSource);


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

export { viewer, cesiumPlaneDataSource, airportDataSource, airportData };
