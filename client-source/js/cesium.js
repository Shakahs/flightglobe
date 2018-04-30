
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';

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
  requestRenderMode: false,
  shouldAnimate: true,
  // automaticallyTrackDataSourceClocks: false,
});

const planeData = new CustomDataSource('planedata');
// const dsClock = new Clock({
//   currentTime: JulianDate.fromIso8601(DateTime.utc().minus({ seconds: 90 }).toISO()),
// });
// planeData.clock = dsClock;

viewer.scene.debugShowFramesPerSecond = true;
// viewer.clock.currentTime = dsClock.currentTime.clone();
viewer.dataSources.add(planeData);

export { viewer, planeData };
