import {FlightObj, FlightStore} from "../flights";
import * as Cesium from "cesium";
import {FlightPosition, PositionUpdate} from "../types";
import {toJS} from "mobx";
import {convertPositionToCartesian} from "../utility";
import {Cartesian3} from "cesium";


const flightA1:PositionUpdate = {
    body:{
        timestamp: Date.now(),
        altitude: 9000,
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
        altitude: 10000,
        latitude: 1,
        longitude: 1,
        heading: 101,
        geohash: "abc"
    },
    type: "positionUpdate",
    icao: "ABCDEF"
};

const flightB1:PositionUpdate = {
    body:{
        timestamp: Date.now(),
        altitude: 9000,
        latitude: 55,
        longitude: 33,
        heading: 100,
        geohash: "bcd"
    },
    type: "positionUpdate",
    icao: "BCDEF"
};


describe("FlightGlobe tests", function() {
    let viewer:Cesium.Viewer;
    let cesiumDiv:HTMLDivElement;
    let flightStore: FlightStore;
    let flightObj: FlightObj;

    beforeAll(function() {
        const cesiumDiv = document.createElement('div');
        document.body.appendChild(cesiumDiv);
        viewer = new Cesium.Viewer(cesiumDiv);
    });

    beforeEach(function() {
        flightStore = new FlightStore(viewer);
        flightStore.addOrUpdateFlight(flightA1);
        flightStore.addOrUpdateFlight(flightB1);
        flightObj = flightStore.flights.get(flightA1.icao) as FlightObj
    });

    // afterEach(function(){
    //     flightStore.destroy()
    // });

    // afterAll(function(){
    //     viewer.destroy()
    //     cesiumDiv.remove()
    // });


    describe("FlightStore", function() {
        it("ensure camera change listener created",function(){
           expect(viewer.camera.changed.numberOfListeners).toBeGreaterThanOrEqual(2)
        });

        describe("stores Flights correctly",function(){

            it("creates Flight Position records",function(){
              expect(flightStore.flightPositions.size).toEqual(2);
              expect(flightStore.flightPositions.get(flightA1.icao)).toEqual(jasmine.any(Array));
              const flightAPositions = flightStore.flightPositions.get(flightA1.icao);
              const flightBPositions = flightStore.flightPositions.get(flightB1.icao);
              if(flightAPositions && flightBPositions){
                  expect(flightAPositions.length).toEqual(1);
                  expect<FlightPosition>(flightA1.body).toEqual(flightAPositions[0]);
                  expect(flightBPositions.length).toEqual(1);
                  expect<FlightPosition>(flightB1.body).toEqual(flightBPositions[0]);
              } else {
                  fail('positions not defined')
              }
              expect(flightStore.flightPositions.get("nonexistant")).not.toBeDefined()
            });

            it("updates Flight Positions",function(){
                flightStore.addOrUpdateFlight(flightA2);
                const flightAPositions = flightStore.flightPositions.get(flightA1.icao);
                if(flightAPositions){
                    expect(flightAPositions.length).toEqual(2);
                    expect<FlightPosition>(flightA2.body).toEqual(flightAPositions[1]);
                } else {
                    fail('positions not defined')
                }
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

        it("computes the correct Positions", function(){
            expect<FlightPosition>(flightObj.latestPosition as FlightPosition).toEqual(flightA1.body);
            flightStore.addOrUpdateFlight(flightA2);
            expect<FlightPosition>(flightObj.latestPosition as FlightPosition).toEqual(flightA2.body);
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

        // xit("computes the correct Point display condition", function () {
        //     expect<boolean>(flightObj.shouldPointDisplay).toBeTruthy()
        // });

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
            flightStore.addOrUpdateFlight(flightA2);
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
            point.position = (Cesium.Cartesian3.fromDegrees(
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
