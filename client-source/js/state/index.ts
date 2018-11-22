import {computed, observable, observe, get, autorun, IObjectDidChange} from 'mobx';
import {Flight, FlightPosition, GeoMap, Icao, PositionUpdate} from "../types";
import * as Cesium from "cesium";
import {createPoint} from "../entities/utility";
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
    @observable flightCartesians = new Map<Icao, Cesium.Cartesian3>();
    newestPositionTimestamp = 0;
    flights = new Map<Icao, any>();
    geoAreas = new Map<Icao, Cesium.PointPrimitiveCollection>();

    constructor(){
        // const disposer = observe(this.flightPositions, this.handlePositionChange)
    }

    // handlePositionChange(change: IObjectDidChange){
    //     if(change.type === "add"){
    //         this.flightCartesians.set(change.name, this.convertPositionToCartesian(change.newValue))
    //     }
    // }

    getOrCreateGeo(id: string):Cesium.PointPrimitiveCollection{
        let geo = this.geoAreas.get(id);
        if(!geo){
            geo = new Cesium.PointPrimitiveCollection();
            viewer.scene.primitives.add(geo);
            this.geoAreas.set(id, geo)
        }
        return geo
    }

    addFlight(pos: PositionUpdate){
        this.flightPositions.set(pos.icao, pos.body);
        const geo = this.getOrCreateGeo(pos.icao[0]);
        this.flights.set(pos.icao, new FlightObj(this, pos.icao, geo))
        this.updateLatestTimestamp(pos)
    }

    updateLatestTimestamp(pos:PositionUpdate){
        this.newestPositionTimestamp = (this.newestPositionTimestamp > pos.body.timestamp) ?
            this.newestPositionTimestamp : pos.body.timestamp;
    }

    @computed get numberFlights(){
        return this.flightPositions.size
    }
}

export class FlightObj {
    flightStore;
    icao;
    point;

    constructor(flightStore, icao: Icao, geo){
        this.flightStore = flightStore;
        this.icao = icao;
        const pos = this.flightStore.flightPositions.get(this.icao);
        this.point = geo.add({position: this.convertPositionToCartesian(pos), pixelSize: 2});
        const disposer = autorun(()=>{
            this.point.position = this.convertPositionToCartesian(this.flightStore.flightPositions.get(this.icao))
        })
    }

    convertPositionToCartesian(pos){
        return Cesium.Cartesian3.fromDegrees(
            pos.longitude,
            pos.latitude,
            pos.altitude
        );
    }
}