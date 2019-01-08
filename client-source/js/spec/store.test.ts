import {FlightObj, FlightStore} from "../store";
import * as Cesium from "cesium";
import {DemographicsUpdate, FlightPosition, FlightRecord, PositionUpdate} from "../types";
import { PointPrimitive} from "cesium";
import {convertPositionToCartesian, newICAOMap} from "../utility";

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

const FlightCDemographic:DemographicsUpdate = {
    type: "demographicUpdate",
    icao: "ZZZF",
    body: {
        origin: "Los Angeles",
        destination: "Tokyo",
        model: "B747"
    }
};


describe("FlightGlobe", function() {
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
        describe('handles LOD changes from moving the globe', function(){
            it("by creating the camera change listener",function(){
                expect(viewer.camera.changed.numberOfListeners).toBeGreaterThanOrEqual(2)
            });

            xit('by responding to camera changes', function(done){
                // spyOn(flightStore,'updateDetailedFlights');
                expect(flightObj.shouldDisplayDetailed).toBeFalsy();

                const test = ()=>{
                    // expect(flightStore.updateDetailedFlights).toHaveBeenCalled();
                    expect(flightObj.shouldDisplayDetailed).toBeTruthy();
                    done()
                };

                viewer.camera.flyTo({
                    destination: convertPositionToCartesian(FlightAPosition1.body),
                    complete: test
                })
            })
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

            it("by storing demographic data for a flight which received position data first", function(){
               const flightRecord = flightStore.flightData.get(FlightAPosition1.icao) as FlightRecord;
               expect(flightRecord.demographic).toEqual({destination:'',origin:'',model:''});
               flightStore.addDemographics(FlightADemographic);
               expect(flightRecord.demographic).toEqual(FlightADemographic.body);
            });

            it("by storing demographic data for a flight before receiving position data", function(){
                expect(flightStore.flightData.get(FlightCDemographic.icao)).not.toBeDefined();
                flightStore.addDemographics(FlightCDemographic);
                const flightRecord = flightStore.flightData.get(FlightCDemographic.icao) as FlightRecord;
                expect(flightRecord.demographic).toEqual(FlightCDemographic.body);
                expect(flightRecord.positions.length).toEqual(0)
            });

            it("by creating Geo resources", function() {
                expect(flightStore.numberGeos()).toEqual(2);
                expect(flightStore.geoAreas.has("a")).toBeTruthy();
                expect(flightStore.geoAreas.has("b")).toBeTruthy();
                expect(flightStore.geoAreas.has("c")).toBeFalsy();
            });

        });

        describe('handles selection criteria', function(){
            it('by updating the selected flight map', function () {
                expect(flightStore.selectedFlights.has(FlightAPosition1.icao)).toBeFalsy();
                flightStore.updateSelectedFlight(new Map<string,boolean>([[FlightAPosition1.icao,true]]));
                expect(flightStore.selectedFlights.has(FlightAPosition1.icao)).toBeTruthy()
                expect(flightStore.selectedFlights.has('zzz')).toBeFalsy();
            });

            it('by updating the filtered flight map', function(){
               expect(flightStore.filteredFlights.get('zzz')).not.toBeDefined();
               const testMap = new Map<string,boolean>([['zzz',true]]);
               flightStore.updateFilteredFlights(testMap);
               expect(flightStore.filteredFlights.get('zzz')).toBeDefined();
               expect(flightStore.filteredFlights.get('xxx')).not.toBeDefined();
            })

            it('by updating the detailed flight map', function(){
                expect(flightStore.detailedFlights.get(FlightAPosition1.body.geohash)).not.toBeDefined();
                const testMap = new Map<string,boolean>([[FlightAPosition1.body.geohash,true]]);
                flightStore.updateDetailedFlights(testMap);
                expect(flightStore.detailedFlights.get(FlightAPosition1.body.geohash)).toBeDefined();
                expect(flightStore.detailedFlights.get(FlightBPosition1.body.geohash)).not.toBeDefined();
            })

        })

    });

    describe("FlightObj",function(){
        it("stores the correct FlightRecord", function() {
            const flightRecord = flightStore.flightData.get(FlightAPosition1.icao) as FlightRecord;
            expect(flightObj.flightRecord).toEqual(flightRecord)
        });

        it("stores the correct id", function() {
            expect(flightObj.icao).toEqual(FlightAPosition1.icao)
        });

       describe('computes essential data', function(){

           describe('by computing', function(){
               it('if a flight is selected', function(){
                   expect(flightObj.isSelected).toEqual(false);
                   flightStore.updateSelectedFlight(new Map<string,boolean>([[FlightAPosition1.icao,true]]));
                   expect(flightObj.isSelected).toEqual(true);
               });

               it("if a flight is detail selected", function () {
                   expect<boolean>(flightObj.isDetailSelected).toBeFalsy();
                   flightStore.updateDetailedFlights(new Map([[FlightAPosition1.body.geohash,true]]));
                   expect<boolean>(flightObj.isDetailSelected).toBeTruthy()
               });

               it('if a flight is filter selected', function(){
                   expect(flightStore.filteredFlights.size).toEqual(0);
                   expect(flightObj.isFilterSelected).toBeTruthy();
                   flightStore.updateFilteredFlights(newICAOMap([FlightBPosition1.icao]));
                   expect(flightStore.filteredFlights.size).toEqual(1);
                   expect(flightObj.isFilterSelected).toBeFalsy();
                   flightStore.updateFilteredFlights(newICAOMap([FlightAPosition1.icao,FlightBPosition1.icao]));
                   // expect(flightObj.isSelected).toBeTruthy();
               });
           })

           describe('by computing visibility', function () {
               it('for a flight when there are no filters or selection', function(){
                   expect(flightObj.shouldDisplay).toEqual(true)
               });

               it('for a flight when it is not in the filter result', function(){
                   expect(flightObj.shouldDisplay).toEqual(true)
                   const dummyMap = new Map<string,boolean>([['zzzz',true]]);
                   flightStore.updateFilteredFlights(dummyMap);
                   expect(flightObj.shouldDisplay).toEqual(false)
               });

               it('for a flight when it is in the filter result', function(){
                   expect(flightObj.shouldDisplay).toEqual(true);
                   const dummyMap = new Map<string,boolean>([[FlightAPosition1.icao,true]]);
                   flightStore.updateFilteredFlights(dummyMap);
                   expect(flightObj.shouldDisplay).toEqual(true)
               });

               it('for a flight when it is selected, but not in the filter result', function(){
                   expect(flightObj.shouldDisplay).toEqual(true); //everything visible by default
                   const dummyMap = new Map<string,boolean>([['zzzz',true]]);
                   flightStore.updateFilteredFlights(dummyMap);
                   expect(flightObj.shouldDisplay).toEqual(false); //filtered out
                   flightStore.updateSelectedFlight(new Map<string,boolean>([[FlightAPosition1.icao,true]]));
                   expect(flightObj.shouldDisplay).toEqual(true); //selected
               });


           });

           it('gets the demographic data', function () {
               expect(flightObj.demographics).toEqual({destination:'',origin:'',model:''});
               flightStore.addDemographics(FlightADemographic);
               expect(flightObj.demographics).toEqual(FlightADemographic.body)
           })
       });

        describe('determines the correct positions', function () {
            it("by deriving all positions", function() {
                flightStore.addOrUpdateFlight(FlightAPosition2);
                expect(flightObj.allPositions).toEqual([
                    FlightAPosition1.body,
                    FlightAPosition2.body,
                ]);
            });

            it("by computing latest Position", function() {
                expect<FlightPosition>(flightObj.latestPosition as FlightPosition).toEqual(FlightAPosition1.body);
                flightStore.addOrUpdateFlight(FlightAPosition2);
                expect<FlightPosition>(flightObj.latestPosition as FlightPosition).toEqual(FlightAPosition2.body);
            });

            it("by updating the computed position", function(){
                flightStore.addOrUpdateFlight(FlightAPosition2);
                expect<FlightPosition>(flightObj.latestPosition as FlightPosition).toEqual(FlightAPosition2.body);
            });

            it("by computing the correct Cartesian Position", function(){
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
        })

        describe('handles Points', function () {

            // xit("computes the correct Point display condition", function () {
            //     expect<boolean>(flightObj.shouldPointDisplay).toBeTruthy()
            // });

            it("by creating the Point Primitive", function () {
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

            it("by updating the Point Primitive location reactively", function () {
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

            it("by updating the Point Primitive location manually", function () {
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
            });

            it('by creating visible new Points when they match the filter', function(){
                flightStore.updateFilteredFlights(new Map<string,boolean>([[FlightBPosition1.icao,true]]))
                flightStore.addOrUpdateFlight(FlightBPosition1);
                const flightB = flightStore.flights.get(FlightBPosition1.icao) as FlightObj;
                const point = flightB.point as PointPrimitive;
                expect(point.show).toEqual(true);
            });

            it('by creating non-visible new Points when they do not match the filter', function(){
                flightStore.updateFilteredFlights(new Map<string,boolean>([['zzz',true]]));
                flightStore.addOrUpdateFlight(FlightBPosition1);
                const flightB = flightStore.flights.get(FlightBPosition1.icao) as FlightObj;
                const point = flightB.point as PointPrimitive;
                expect(point.show).toEqual(false)
            });

            it('by toggling visibility when visibility criteria changes', function () {
                const point = flightObj.point as PointPrimitive;
                expect(point.show).toBeTruthy();
                flightStore.updateFilteredFlights(new Map<string,boolean>([['zzz',true]]));
                expect(point.show).toBeFalsy();
                flightStore.updateFilteredFlights(new Map<string,boolean>([]));
                expect(point.show).toBeTruthy();
            })

        });

        describe('handles Trails', function () {
            describe('by computing the correct Trail display condition', function () {

                it('when the flight is selected', function(){
                    expect<boolean>(flightObj.shouldTrailDisplay).toBeFalsy();
                    flightStore.addOrUpdateFlight(FlightAPosition2);
                    flightStore.updateSelectedFlight(newICAOMap([FlightAPosition1.icao]));
                    expect<boolean>(flightObj.shouldTrailDisplay).toBeTruthy();
                });

                it('when LOD increases', function(){
                    expect<boolean>(flightObj.shouldTrailDisplay).toBeFalsy();
                    flightStore.addOrUpdateFlight(FlightAPosition2);
                    flightStore.updateDetailedFlights(new Map([[FlightAPosition1.body.geohash,true]]));
                    expect<boolean>(flightObj.shouldTrailDisplay).toBeTruthy();
                })

                it('when LOD increases but the flight is also filtered out', function(){
                    expect<boolean>(flightObj.shouldTrailDisplay).toBeFalsy();
                    flightStore.addOrUpdateFlight(FlightAPosition2);
                    flightStore.updateDetailedFlights(new Map([[FlightAPosition1.body.geohash,true]]));
                    flightStore.updateFilteredFlights(newICAOMap(['zzz']));
                    expect<boolean>(flightObj.shouldTrailDisplay).toBeFalsy();
                })


                it('when the flight is filtered out but also selected', function(){
                    expect<boolean>(flightObj.shouldTrailDisplay).toBeFalsy();
                    flightStore.addOrUpdateFlight(FlightAPosition2);
                    flightStore.updateFilteredFlights(newICAOMap(['zzz']));
                    flightStore.updateSelectedFlight(newICAOMap([FlightAPosition1.icao]));
                    expect<boolean>(flightObj.shouldTrailDisplay).toBeTruthy();
                });

            });

            it('by creating the trail', function () {
               flightStore.addOrUpdateFlight(FlightAPosition2);
                flightStore.updateDetailedFlights(new Map([[FlightAPosition2.body.geohash,true]]));
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

            it('by destroying the trail', function(){
                expect(flightObj.trail).toBeNull();
                flightStore.addOrUpdateFlight(FlightAPosition2);
                flightStore.updateDetailedFlights(new Map([[FlightAPosition2.body.geohash,true]]));
                expect(flightObj.trail).not.toBeNull();
                flightStore.updateDetailedFlights(new Map());
                expect(flightObj.trail).toBeNull();
            })
        });

        describe('handles Labels', function () {
            it("computes the correct Label display condition", function () {
                expect<boolean>(flightObj.shouldLabelDisplay).toBeFalsy();
                flightStore.updateDetailedFlights(new Map([[FlightAPosition1.body.geohash,true]]));
                expect<boolean>(flightObj.shouldLabelDisplay).toBeTruthy();
            });

            it('by computing the correct label text when demographics are available', function(){
                flightStore.addDemographics(FlightADemographic);
                expect(flightObj.labelText.length).toBeGreaterThan(0);
                expect(flightObj.labelText.indexOf("Tokyo")).toBeGreaterThan(0);
            });

            it('creates, displays, and destroys the Label', function () {
                flightStore.updateDetailedFlights(new Map([[FlightAPosition1.body.geohash,true]]));
                const flight = flightStore.flights.get(FlightAPosition1.icao);
                if(flight && flight.label){
                    expect(flight.geoCollection.labels.contains(flight.label)).toBeTruthy();
                    expect(flight.label.position).toEqual(Cesium.Cartesian3.fromDegrees(
                        FlightAPosition1.body.longitude,
                        FlightAPosition1.body.latitude,
                        FlightAPosition1.body.altitude,
                    ));
                    flightStore.addDemographics(FlightADemographic);
                    flightStore.updateDetailedFlights(new Map());
                    expect(flight.geoCollection.labels.contains(flight.label)).toBeFalsy();
                    expect(flight.label).toBeNull();
                } else {
                    fail('flight or label not defined')
                }
            });

            it('updates the Label position', function () {
                flightStore.updateDetailedFlights(new Map([[FlightAPosition1.body.geohash,true]]));
                flightStore.addOrUpdateFlight(FlightAPosition2);
                flightStore.updateDetailedFlights(new Map([[FlightAPosition2.body.geohash,true]]));
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
