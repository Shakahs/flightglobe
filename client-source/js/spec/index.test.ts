import {FlightStore} from "../flights";


describe("A suite is just a function", function() {
    var a;

    it("and so is a spec", function() {
        a = true;

        expect(a).toBe(true);
    });
});

// describe("A suite is just a function", function() {
    // const viewer = new Cesium.Viewer('cesiumContainer', {
    //     animation: false,
    //     baseLayerPicker: false,
    //     fullscreenButton: false,
    //     geocoder: false,
    //     homeButton: false,
    //     infoBox: false,
    //     sceneModePicker: false,
    //     selectionIndicator: true,
    //     timeline: false,
    //     navigationHelpButton: false,
    //     scene3DOnly: true,
    //     // imageryProvider,
    //     // terrainProvider,
    //     requestRenderMode: true,
    //     maximumRenderTimeChange : Infinity,
    //     // targetFrameRate: 30
    //     // shouldAnimate: true,
    //     // automaticallyTrackDataSourceClocks: false,
    // });
    //
    // const flightStore = new FlightStore(viewer);
    // flightStore.addOrUpdateFlight({
    //     body:{
    //         timestamp: Date.now(),
    //         altitude: 30000,
    //         latitude: 55,
    //         longitude: 33,
    //         heading: 100,
    //         geohash: "abc"
    //     },
    //     type: "positionUpdate",
    //     icao: "ABCDEF"
    // })
    //
    // it("ensure Geo resource created", function() {
    //     expect(flightStore.geoAreas.has("a"))
    // });
// });
