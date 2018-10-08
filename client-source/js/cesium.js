import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';

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

export { viewer, planeData, airportData };
