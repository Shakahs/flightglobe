import {computed, observable, observe, get, autorun, IObjectDidChange} from 'mobx';
import {Flight, FlightPosition, GeoMap, Icao, PositionUpdate} from "../types";
import * as Cesium from "cesium";
import {convertPositionToCartesian, createPoint} from "../entities/utility";
import {viewer} from "../setup";

// export const flightStore = observable.map<Icao, Flight>([], {name: "flights"});

// export const geoAreas = computed<GeoMap>(():GeoMap=>{
//     const newGeoAreas:GeoMap = new Map();
//     flightStore.forEach((f)=>{
//         if(f.icao[0] && !newGeoAreas.has(f.icao[0])){
//             newGeoAreas.set(f.icao[0], new Cesium.PointPrimitiveCollection());
//         }
//     });
//     return newGeoAreas
// });
//
// const disposer = observe(flightStore, (change)=>{
//     if(change.type === 'add'){
//         // const geoArea = get<string, Cesium.PointPrimitiveCollection>(geoAreas, change.newValue.icao[0]);
//         const geoArea = geoAreas.get().get(change.newValue.icao[0]);
//         if(geoArea){
//
//
//
//             change.newValue.point = geoArea.add(createPoint(newPosition))
//         }
//     }
// });

export class FlightStore {
    @observable flightPositions = new Map<Icao, FlightPosition>();
    newestPositionTimestamp = 0;
    flights = new Map<Icao, any>();
    @observable geoAreas = new Map<Icao, Cesium.PointPrimitiveCollection>();

    getOrCreateGeo(id: string):Cesium.PointPrimitiveCollection{
        let geo = this.geoAreas.get(id);
        if(!geo){
            geo = new Cesium.PointPrimitiveCollection();
            viewer.scene.primitives.add(geo);
            this.geoAreas.set(id, geo)
        }
        return geo
    }

    addOrUpdateFlight(pos: PositionUpdate){
        this.flightPositions.set(pos.icao, pos.body);
        const geo = this.getOrCreateGeo(pos.icao[0]);
        const thisFlight = this.flights.get(pos.icao);
        if(thisFlight && (thisFlight.geo !== geo)){
            thisFlight.destroyPoint();
            thisFlight.geo = geo;
            thisFlight.createPoint();
            console.log('point migrated to new geo')
        } else {
            this.flights.set(pos.icao, new FlightObj(this, pos.icao, geo));
        }
        this.updateLatestTimestamp(pos)
    }

    updateLatestTimestamp(pos:PositionUpdate){
        this.newestPositionTimestamp = (this.newestPositionTimestamp > pos.body.timestamp) ?
            this.newestPositionTimestamp : pos.body.timestamp;
    }

    @computed get numberFlights(){
        return this.flightPositions.size
    }

    @computed get numberGeos(){
        return this.geoAreas.size
    }
}

export class FlightObj {
    flightStore;
    icao;
    point;
    geo;

    constructor(flightStore, icao: Icao, geo){
        this.flightStore = flightStore;
        this.icao = icao;
        this.geo = geo;
        this.createPoint();
        const disposer = autorun(()=>{
            this.point.position = convertPositionToCartesian(this.flightStore.flightPositions.get(this.icao))
        })
    }

    createPoint(){
        const pos = this.flightStore.flightPositions.get(this.icao);
        this.point = this.geo.add({position: convertPositionToCartesian(pos), pixelSize: 2});
    }

    destroyPoint(){
        this.geo.remove(this.point)
    }

}