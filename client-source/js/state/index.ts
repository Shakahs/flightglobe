import {computed, observable, observe, get, autorun, IObjectDidChange} from 'mobx';
import {DemographicsUpdate, Flight, FlightDemographics, FlightPosition, GeoMap, Icao, PositionUpdate} from "../types";
import * as Cesium from "cesium";
import {convertPositionToCartesian, createPoint} from "../entities/utility";

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
//             change.newValue.point = geoArea.add(createPrimitives(newPosition))
//         }
//     }
// });

export class FlightStore {
    @observable flightPositions = new Map<Icao, FlightPosition>();
    @observable flightDemographics = new Map<Icao, FlightDemographics>();
    @observable geoAreas = new Map<Icao, GeoResource>();
    flights = new Map<Icao, any>();
    newestPositionTimestamp = 0;
    viewer:Cesium.Viewer;

    constructor(viewer: Cesium.Viewer){
        this.viewer = viewer;
    }

    getOrCreateGeo(id: string):GeoResource{
        let geo = this.geoAreas.get(id);
        if(!geo){
            geo = new GeoResource(id, this.viewer);
            this.geoAreas.set(id, geo)
        }
        return geo
    }

    addOrUpdateFlight(pos: PositionUpdate){
        this.flightPositions.set(pos.icao, pos.body);
        const geo = this.getOrCreateGeo(pos.geohash[0]);
        const thisFlight = this.flights.get(pos.icao);
        if(thisFlight && (thisFlight.geo !== geo)){
            thisFlight.destroyPrimitives();
            thisFlight.geo = geo;
            thisFlight.createPrimitives();
        } else {
            this.flights.set(pos.icao, new FlightObj(this, pos.icao, geo));
        }
        this.updateLatestTimestamp(pos)
    }

    addDemographics(dem: DemographicsUpdate){
        this.flightDemographics.set(dem.icao, dem.body)
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
    geo;
    point;

    constructor(flightStore, icao: Icao, geo){
        this.flightStore = flightStore;
        this.icao = icao;
        this.geo = geo;
        this.createPrimitives();
        const disposer = autorun(()=>{
            this.point.position = convertPositionToCartesian(this.flightStore.flightPositions.get(this.icao))
        })
    }

    createPrimitives(){
        const pos = this.flightStore.flightPositions.get(this.icao);
        this.point = this.geo.points.add({position: convertPositionToCartesian(pos), pixelSize: 2});
    }

    destroyPrimitives(){
        this.geo.points.remove(this.point)
    }

    // createLabelText(dem: FlightDemographics){
    //
    // }
}

export class GeoResource {
    id;
    points;
    labels;
    viewer;

    constructor(id: string, viewer: Cesium.Viewer){
        this.id = id;
        this.viewer = viewer;
        this.points = new Cesium.PointPrimitiveCollection();
        this.labels = new Cesium.LabelCollection();
        viewer.scene.primitives.add(this.points);
        viewer.scene.primitives.add(this.labels);
    }
}