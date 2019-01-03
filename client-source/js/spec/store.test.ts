import {FlightObj, FlightStore} from "../store";
import * as Cesium from "cesium";
import {DemographicsUpdate, FlightPosition, FlightRecord, PositionUpdate} from "../types";
import {toJS} from "mobx";
import {convertPositionToCartesian} from "../utility";
import {Cartesian3} from "cesium";


const FlightAPosition1:PositionUpdate = {
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

const FlightAPosition2:PositionUpdate = {
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

const FlightADemographic:DemographicsUpdate = {
    type: "demographicUpdate",
    icao: "ABCDEF",
    body: {
        origin: "Los Angeles",
        destination: "Tokyo",
        model: "B747"
    }
};

const FlightBPosition1:PositionUpdate = {
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
        flightStore.addOrUpdateFlight(FlightAPosition1);
        flightStore.addOrUpdateFlight(FlightBPosition1);
        flightObj = flightStore.flights.get(FlightAPosition1.icao) as FlightObj
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

        describe("handles flight records",function(){

            it("by creating flight records",function(){
              expect(flightStore.flightData.size).toEqual(2);
              expect(flightStore.flightData.get(FlightAPosition1.icao)).toBeDefined();
              expect(flightStore.flightData.get(FlightBPosition1.icao)).toBeDefined();
              expect(flightStore.flightData.get("nonexistant")).not.toBeDefined()
            });

            it("by storing flight positions", function () {
                const flightARecord = flightStore.flightData.get(FlightAPosition1.icao);
                const flightBRecord = flightStore.flightData.get(FlightBPosition1.icao);
                if(flightARecord && flightARecord.positions && flightBRecord && flightBRecord.positions){
                    expect(flightARecord.positions.length).toEqual(1);
                    expect<FlightPosition>(FlightAPosition1.body).toEqual(flightARecord.positions[0]);
                    expect(flightBRecord.positions.length).toEqual(1);
                    expect<FlightPosition>(FlightBPosition1.body).toEqual(flightBRecord.positions[0]);
                } else {
                    fail('records not defined')
                }
            });

            it("by updating flight positions",function(){
                flightStore.addOrUpdateFlight(FlightAPosition2);
                const flightARecord = flightStore.flightData.get(FlightAPosition1.icao);
                if(flightARecord && flightARecord.positions){
                    expect(flightARecord.positions.length).toEqual(2);
                    expect<FlightPosition>(FlightAPosition1.body).toEqual(flightARecord.positions[0]);
                    expect<FlightPosition>(FlightAPosition2.body).toEqual(flightARecord.positions[1]);
                } else {
                    fail('positions not defined')
                }
            })

            it("by storing demographic data", function(){
               let flightRecord =  flightStore.flightData.get(FlightAPosition1.icao) as FlightRecord;
               expect(flightRecord.demographic).not.toBeDefined();
               flightStore.addDemographics(FlightADemographic);
               flightRecord =  flightStore.flightData.get(FlightAPosition1.icao) as FlightRecord;
               expect(flightRecord.demographic).toEqual(FlightADemographic.body)
            });

            it("by creating Geo resources", function() {
                expect(flightStore.numberGeos()).toEqual(2);
                expect(flightStore.geoAreas.has("a")).toBeTruthy();
                expect(flightStore.geoAreas.has("b")).toBeTruthy();
                expect(flightStore.geoAreas.has("c")).toBeFalsy();
            });

        });

    });

    describe("FlightObj",function(){

        describe('computes data', function () {


            it("computes Positions", function() {
                expect<FlightPosition>(flightObj.latestPosition as FlightPosition).toEqual(FlightAPosition1.body);
            })

            it("updates the computed position", function(){
                flightStore.addOrUpdateFlight(FlightAPosition2);
                expect<FlightPosition>(flightObj.latestPosition as FlightPosition).toEqual(FlightAPosition2.body);
            });

            it("computes the correct Cartesian Positions", function(){
                expect<Cesium.Cartesian3>(flightObj.cartesianPosition as Cesium.Cartesian3).toEqual(Cesium.Cartesian3.fromDegrees(
                    FlightAPosition1.body.longitude,
                    FlightAPosition1.body.latitude,
                    FlightAPosition1.body.altitude,
                ));
                flightStore.addOrUpdateFlight(FlightAPosition2);
                expect<Cesium.Cartesian3>(flightObj.cartesianPosition as Cesium.Cartesian3).toEqual(Cesium.Cartesian3.fromDegrees(
                    FlightAPosition2.body.longitude,
                    FlightAPosition2.body.latitude,
                    FlightAPosition2.body.altitude,
                ));
            });

            it("computes the correct Level of Detail", function () {
                expect<number>(flightObj.levelOfDetail).toEqual(0);
                flightStore.geoLevelOfDetail.set(FlightAPosition1.body.geohash,1);
                expect<number>(flightObj.levelOfDetail).toEqual(1);
            });
        });

        describe('handles Points', function () {

            // xit("computes the correct Point display condition", function () {
            //     expect<boolean>(flightObj.shouldPointDisplay).toBeTruthy()
            // });

            it("creates the Point Primitive", function () {
                expect(flightObj.point).not.toBeNull();
                const point = flightObj.point;
                if(point){
                    expect(point.position).toEqual(Cesium.Cartesian3.fromDegrees(
                        FlightAPosition1.body.longitude,
                        FlightAPosition1.body.latitude,
                        FlightAPosition1.body.altitude,
                    ));
                    expect(flightObj.geoCollection.points.contains(point)).toBeTruthy()
                } else {
                    fail('point not defined')
                }

            });

            it("updates the Point Primitive location reactively", function () {
                expect(flightObj.point).not.toBeNull();
                const point = flightObj.point;
                if(point){
                    flightStore.addOrUpdateFlight(FlightAPosition2);
                    expect<Cesium.Cartesian3>(point.position).toEqual(Cesium.Cartesian3.fromDegrees(
                        FlightAPosition2.body.longitude,
                        FlightAPosition2.body.latitude,
                        FlightAPosition2.body.altitude,
                    ));
                } else {
                    fail('point not defined')
                }
            });

            it("updates the Point Primitive location manually", function () {
                expect(flightObj.point).not.toBeNull();
                const point = flightObj.point;
                if(point){
                    expect(point.position).toEqual(Cesium.Cartesian3.fromDegrees(
                        FlightAPosition1.body.longitude,
                        FlightAPosition1.body.latitude,
                        FlightAPosition1.body.altitude,
                    ));
                    point.position = (Cesium.Cartesian3.fromDegrees(
                        FlightAPosition2.body.longitude,
                        FlightAPosition2.body.latitude,
                        FlightAPosition2.body.altitude,
                    ));
                    expect(point.position).toEqual(Cesium.Cartesian3.fromDegrees(
                        FlightAPosition2.body.longitude,
                        FlightAPosition2.body.latitude,
                        FlightAPosition2.body.altitude,
                    ))
                } else {
                    fail('point not defined')
                }
            })
        });

        describe('handles Trails', function () {
            it('computes the correct Trail display condition', function () {
                expect<boolean>(flightObj.shouldTrailDisplay).toBeFalsy();
                flightStore.geoLevelOfDetail.set(FlightAPosition1.body.geohash,1);
                expect<boolean>(flightObj.shouldTrailDisplay).toBeTruthy();
            });

            it('creates and displays the Trail', function () {
               flightStore.addOrUpdateFlight(FlightAPosition2);
               flightStore.geoLevelOfDetail.set(FlightAPosition2.body.geohash,1);
               const expectedPositions = [
                   Cesium.Cartesian3.fromDegrees(
                       FlightAPosition1.body.longitude,
                       FlightAPosition1.body.latitude,
                       FlightAPosition1.body.altitude,
                   ),
                  Cesium.Cartesian3.fromDegrees(
                       FlightAPosition2.body.longitude,
                       FlightAPosition2.body.latitude,
                       FlightAPosition2.body.altitude,
                   )
               ];
               if(flightObj.trail){
                   expect(flightObj.trail.positions).toEqual(expectedPositions);
                   expect(flightObj.geoCollection.lines.contains(flightObj.trail)).toBeTruthy()
               } else {
                   fail('trail not defined')
               }
            })
        });

        describe('handles Labels', function () {
            it("computes the correct Label display condition", function () {
                expect<boolean>(flightObj.shouldLabelDisplay).toBeFalsy();
                flightStore.geoLevelOfDetail.set(FlightAPosition1.body.geohash,1);
                expect<boolean>(flightObj.shouldLabelDisplay).toBeTruthy();
            });

            xit('creates, displays, and destroys the Label', function () {
                flightStore.geoLevelOfDetail.set(FlightAPosition1.body.geohash,1);
                const flight = flightStore.flights.get(FlightAPosition1.icao);
                if(flight && flight.label){
                    expect(flight.geoCollection.labels.contains(flight.label)).toBeTruthy();
                    expect(flight.label.position).toEqual(Cesium.Cartesian3.fromDegrees(
                        FlightAPosition1.body.longitude,
                        FlightAPosition1.body.latitude,
                        FlightAPosition1.body.altitude,
                    ));
                    flightStore.geoLevelOfDetail.clear();
                    expect(flight.geoCollection.labels.contains(flight.label)).toBeFalsy();
                    expect(flight.label).not.toBeDefined()
                } else {
                    fail('flight or label not defined')
                }
            });

            it('updates the Label position', function () {
                flightStore.geoLevelOfDetail.set(FlightAPosition1.body.geohash,1);
                flightStore.addOrUpdateFlight(FlightAPosition2);
                flightStore.geoLevelOfDetail.clear();
                flightStore.geoLevelOfDetail.set(FlightAPosition2.body.geohash,1);
                const flight = flightStore.flights.get(FlightAPosition1.icao);
                if(flight && flight.label){
                    expect(flight.label.position).toEqual(Cesium.Cartesian3.fromDegrees(
                        FlightAPosition2.body.longitude,
                        FlightAPosition2.body.latitude,
                        FlightAPosition2.body.altitude,
                    ))
                } else {
                    fail('flight or label not defined')
                }
            })

        })

    })
});