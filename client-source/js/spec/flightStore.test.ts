import {FlightStore} from "../flightStore";
import * as Cesium from "cesium";
import {PointPrimitive} from "cesium";
import {FlightPosition, FlightRecord} from "../types";
import {convertPositionToCartesian, newICAOMap} from "../utility";
import {
    FlightADemographic,
    FlightAPosition1,
    FlightAPosition2,
    FlightBPosition1,
    FlightCDemographic,
    FlightCPosition1
} from "./mockData";
import {flightObj, flightStore, viewer} from "./mockSetup";
import {FlightObj} from "../flightObj";


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

    describe('routes update messages',()=>{
        it('by routing position updates', ()=>{
            expect(flightStore.flightData.size).toEqual(2);
            flightStore.routeUpdate(FlightCPosition1);
            expect(flightStore.flightData.size).toEqual(3);
            const flightC = flightStore.flightData.get(FlightCPosition1.icao) as FlightRecord;
            expect(flightC.positions[0]).toEqual(FlightCPosition1.body)
        })
        it('by routing demographic updates', ()=>{
            expect(flightStore.flightData.size).toEqual(2);
            flightStore.routeUpdate(FlightCDemographic);
            expect(flightStore.flightData.size).toEqual(3);
            const flightC = flightStore.flightData.get(FlightCDemographic.icao) as FlightRecord;
            expect(flightC.demographic).toEqual(FlightCDemographic.body)
        })
    })

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


