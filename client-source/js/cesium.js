import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';
import axios from 'axios';

import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';
import loadAirports from './airports';

const airportDataRaw = require('../resources/airports.json');

const viewer = new Viewer('cesiumContainer', {
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

const planeData = new CustomDataSource('planes');
viewer.dataSources.add(planeData);
// const dsClock = new Clock({
//   currentTime: JulianDate.fromIso8601(DateTime.utc().minus({ seconds: 90 }).toISO()),
// });
// planeData.clock = dsClock;

viewer.scene.debugShowFramesPerSecond = true;
// viewer.clock.currentTime = dsClock.currentTime.clone();

const airportData = new CustomDataSource('airports');
viewer.dataSources.add(airportData);

loadAirports(airportData, airportDataRaw);

const { scene } = viewer;
const handler = new ScreenSpaceEventHandler(scene.canvas);
handler.setInputAction(async (click) => {
  const pickedObject = scene.pick(click.position);
  if (pickedObject) {
    const trackURL = `/track?icao=${ pickedObject.id._id }`;
    console.log(trackURL);
    const {data} = await axios.get(trackURL);
    console.log(data);
  }
}, ScreenSpaceEventType.LEFT_CLICK);

export { viewer, planeData, airportData };
