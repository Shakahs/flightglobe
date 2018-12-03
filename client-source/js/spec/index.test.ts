import {FlightObj, FlightStore} from "../flights";
import * as Cesium from "cesium";
import {FlightPosition, PositionUpdate} from "../types";
import {toJS} from "mobx";
import {convertPositionToCartesian} from "../utility";
import {Cartesian3} from "cesium";

describe("FlightGlobe tests", function() {
    let viewer:Cesium.Viewer;

    beforeAll(function() {
        const cesiumDiv = document.createElement('div');
        document.body.appendChild(cesiumDiv);

        viewer = new Cesium.Viewer(cesiumDiv, {
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

    });



    const flightA1:PositionUpdate = {
        body:{
            timestamp: Date.now(),
            altitude: 30000,
            latitude: 55,
            longitude: 33,
            heading: 100,
            geohash: "abc"
        },
        type: "positionUpdate",
        icao: "ABCDEF"
    };
    const flightA2:PositionUpdate = {
        body:{
            timestamp: Date.now(),
            altitude: 31000,
            latitude: 56,
            longitude: 34,
            heading: 101,
            geohash: "abc"
        },
        type: "positionUpdate",
        icao: "ABCDEF"
    };

    const flightB1:PositionUpdate = {
        body:{
            timestamp: Date.now(),
            altitude: 30000,
            latitude: 55,
            longitude: 33,
            heading: 100,
            geohash: "bcd"
        },
        type: "positionUpdate",
        icao: "BCDEF"
    };

    describe("FlightStore", function() {
        it("ensure camera change listener created",function(){
           expect(viewer.camera.changed.numberOfListeners).toEqual(1)
        });

        describe("stores Flights correctly",function(){
            let flightStore: FlightStore;
            beforeAll(()=>{
                flightStore = new FlightStore(viewer);
                flightStore.addOrUpdateFlight(flightA1);
                flightStore.addOrUpdateFlight(flightB1);
            });

            it("created Flight Positions",function(){
              expect(flightStore.numberFlights()).toEqual(2);
              expect<FlightPosition>(flightA1.body).toEqual(flightStore.flightPositions.toJS().get(flightA1.icao) as FlightPosition);
              expect<FlightPosition>(flightB1.body).toEqual(flightStore.flightPositions.toJS().get(flightB1.icao) as FlightPosition);
              expect(flightStore.flightPositions.get("nonexistant")).toBeFalsy()
            });

            it("updated Flight Positions",function(){
                flightStore.addOrUpdateFlight(flightA2);
                expect<FlightPosition>(flightA2.body).toEqual(flightStore.flightPositions.toJS().get(flightA1.icao) as FlightPosition);
            });

            it("created correct Geo resources", function() {
                expect(flightStore.numberGeos()).toEqual(2);
                expect(flightStore.geoAreas.has("a")).toBeTruthy();
                expect(flightStore.geoAreas.has("b")).toBeTruthy();
                expect(flightStore.geoAreas.has("c")).toBeFalsy();
            });

        });

    });

    describe("FlightObj",function(){
        let flightStore: FlightStore;
        let flightObj: FlightObj;

        beforeEach(()=>{
            flightStore = new FlightStore(viewer);
            flightStore.addOrUpdateFlight(flightA1);
            flightObj = flightStore.flights.get(flightA1.icao) as FlightObj;
        });

        it("computes the correct Positions", function(){
            expect<FlightPosition>(flightObj.position as FlightPosition).toEqual(flightA1.body);
            expect<FlightPosition>(flightObj.position as FlightPosition).toBeDefined();
            flightStore.addOrUpdateFlight(flightA2);
            expect<FlightPosition>(flightObj.position as FlightPosition).toEqual(flightA2.body);
            expect<FlightPosition>(flightObj.position as FlightPosition).toBeDefined();
        });

        it("computes the correct Cartesian Positions", function(){
            expect<Cesium.Cartesian3>(flightObj.cartesianPosition as Cesium.Cartesian3).toEqual(Cesium.Cartesian3.fromDegrees(
                flightA1.body.longitude,
                flightA1.body.latitude,
                flightA1.body.altitude,
            ));
            flightStore.addOrUpdateFlight(flightA2);
            expect<Cesium.Cartesian3>(flightObj.cartesianPosition as Cesium.Cartesian3).toEqual(Cesium.Cartesian3.fromDegrees(
                flightA2.body.longitude,
                flightA2.body.latitude,
                flightA2.body.altitude,
            ));
        });

        it("computes the correct Level of Detail", function () {
            expect<number>(flightObj.levelOfDetail).toEqual(0);
            flightStore.geoLevelOfDetail.set(flightA1.body.geohash,1);
            expect<number>(flightObj.levelOfDetail).toEqual(1);
        });

        it("computes the correct Point display condition", function () {
            expect<boolean>(flightObj.shouldPointDisplay).toBeTruthy()
        });

        it("computes the correct Label display condition", function () {
            expect<boolean>(flightObj.shouldLabelDisplay).toBeFalsy();
            flightStore.geoLevelOfDetail.set(flightA1.body.geohash,1);
            expect<boolean>(flightObj.shouldLabelDisplay).toBeTruthy();
        });

        it("creates and places the Point Primitive", function () {
            expect(flightObj.point).not.toBeNull();
            const point = flightObj.point as Cesium.PointPrimitive;
            expect(point.position).toEqual(Cesium.Cartesian3.fromDegrees(
                flightA1.body.longitude,
                flightA1.body.latitude,
                flightA1.body.altitude,
            ));
        });

        it("updates the Point Primitive reactively", function () {
            expect(flightObj.point).not.toBeNull();
            const point = flightObj.point as Cesium.PointPrimitive;
            spyOn(flightObj,'createOrUpdatePoint');
            flightStore.addOrUpdateFlight(flightA2);
            expect(flightObj.createOrUpdatePoint).toHaveBeenCalledTimes(1);
            expect<Cesium.Cartesian3>(point.position).toEqual(Cesium.Cartesian3.fromDegrees(
                flightA2.body.longitude,
                flightA2.body.latitude,
                flightA2.body.altitude,
            ));
        });

        it("updates the Point Primitive manually", function () {
            expect(flightObj.point).not.toBeNull();
            const point = flightObj.point as Cesium.PointPrimitive;
            expect(point.position).toEqual(Cesium.Cartesian3.fromDegrees(
                flightA1.body.longitude,
                flightA1.body.latitude,
                flightA1.body.altitude,
            ));
            flightObj.createOrUpdatePoint(Cesium.Cartesian3.fromDegrees(
                flightA2.body.longitude,
                flightA2.body.latitude,
                flightA2.body.altitude,
            ));
            expect(point.position).toEqual(Cesium.Cartesian3.fromDegrees(
                flightA2.body.longitude,
                flightA2.body.latitude,
                flightA2.body.altitude,
            ))
        })

    })


});
