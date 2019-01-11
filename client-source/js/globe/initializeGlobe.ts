import * as Cesium from "cesium";

// import {ScreenSpaceEventHandler} from 'cesium';
// import {ScreenSpaceEventType} from 'cesium';
// import loadAirports from './airports';


// const airportDataRaw = require('../resources/airports.json');
// const airportData = new Cesium.CustomDataSource('airports');
// loadAirports(airportData, airportDataRaw);

//@ts-ignore. This is not in the Cesium TypeScript definitions yet
// Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0OThjM2RiYS02MjA0LTQ1MDEtYjU2Ni00MzY2NjlkY2Q1ODMiLCJpZCI6NjQxMywic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0NjQ3NzQ1NX0.Z85-lIf_qTbJ2z2FcSez-bDeVHJ_H9u_OjxPFO16ios';

const viewer = new Cesium.Viewer('cesiumContainer', {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    // infoBox: false,
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
    imageryProvider : new Cesium.BingMapsImageryProvider({
        url: 'http://dev.virtualearth.net',
        key: 'Annkf_qhmEYkCSYC9PrxYrFwP1ZJOH1wm1x_g5GeuoXkWII7RU94Npx8VJUFwDMZ',
        mapStyle: 'AerialWithLabels'
    }),
});

// viewer.imageryLayers.addImageryProvider(
//     new Cesium.IonImageryProvider({
//         assetId: 3,
//     })
// );

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
