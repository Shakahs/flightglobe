import * as Cesium from "cesium";

// import {ScreenSpaceEventHandler} from 'cesium';
// import {ScreenSpaceEventType} from 'cesium';
// import loadAirports from './airports';


// const airportDataRaw = require('../resources/airports.json');
// const airportData = new Cesium.CustomDataSource('airports');
// loadAirports(airportData, airportDataRaw);

const viewer = new Cesium.Viewer('cesiumContainer', {
    animation: false,
    baseLayerPicker: false,
    // fullscreenButton: false,
    // geocoder: false,
    // homeButton: false,
    // infoBox: false,
    sceneModePicker: false,
    selectionIndicator: true,
    timeline: false,
    // navigationHelpButton: false,
    scene3DOnly: true,
    // imageryProvider,
    // terrainProvider,
    requestRenderMode: true,
    maximumRenderTimeChange : Infinity,
    // targetFrameRate: 30
    // shouldAnimate: true,
    // automaticallyTrackDataSourceClocks: false,
});

// viewer.camera.defaultZoomAmount = 1000000.0;
// viewer.screenSpaceEventHandler.setInputAction(
//     ()=>{viewer.camera.zoomIn()},
//     Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
// );
// viewer.scene.debugShowFramesPerSecond = true;
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

export { viewer };
