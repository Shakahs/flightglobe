import {computed, observable, observe, get, autorun, IObjectDidChange} from 'mobx';
import {DemographicsUpdate, Flight, FlightDemographics, FlightPosition, GeoMap, Icao, PositionUpdate} from "../types";
import * as Cesium from "cesium";
import {convertPositionToCartesian, createPoint} from "../entities/utility";
const Geohash = require('latlon-geohash');
import {forEach} from "lodash-es";

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
    @observable flightDemographics = new Map<Icao, FlightDemographics>();
    @observable geoLevelOfDetail = new Map<string, number>();
    geoAreas = new Map<Icao, GeoCollection>();
    flights = new Map<Icao, any>();
    newestPositionTimestamp = 0;
    viewer:Cesium.Viewer;

    constructor(viewer: Cesium.Viewer){
        this.viewer = viewer;
        viewer.camera.changed.addEventListener(() => {
          const ellipsoid = this.viewer.scene.globe.ellipsoid;
          const cameraPosition = ellipsoid.cartesianToCartographic(this.viewer.camera.position);
          const focusGeo = Geohash.encode(cameraPosition.latitude*180/Math.PI,
              cameraPosition.longitude*180/Math.PI, 3);
            this.geoLevelOfDetail.clear();
            forEach(Geohash.neighbours(focusGeo), (neighbor)=>{
                this.geoLevelOfDetail.set(neighbor, 1)
            })
        });
    }

    getOrCreateGeoCollection(id: string):GeoCollection{
        let geo = this.geoAreas.get(id);
        if(!geo){
            geo = new GeoCollection(id, this.viewer);
            this.geoAreas.set(id, geo)
        }
        return geo
    }

    addOrUpdateFlight(pos: PositionUpdate){
        this.flightPositions.set(pos.icao, pos.body);
        const geoColl = this.getOrCreateGeoCollection(pos.body.geohash[0]);
        const thisFlight = this.flights.get(pos.icao);
        if(thisFlight && (thisFlight.geoCollection !== geoColl)){
            thisFlight.destroyPoint();
            thisFlight.geoCollection = geoColl;
            thisFlight.createPoint();
        } else {
            this.flights.set(pos.icao, new FlightObj(this, pos.icao, geoColl));
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

    numberFlights(){
        return this.flightPositions.size
    }

    numberGeos(){
        return this.geoAreas.size
    }
}
const labelOffset = new Cesium.Cartesian2(10, 20);
const labelDisplayCondition = new Cesium.DistanceDisplayCondition(0.0, 2000000);

export class FlightObj {
    flightStore;
    icao;
    geoCollection;
    point;
    label;
    // levelOfDetail;


    constructor(flightStore, icao: Icao, geo){
        this.flightStore = flightStore;
        this.icao = icao;
        this.geoCollection = geo;
        this.createPoint();
        const disposer = autorun(()=>{
            this.point.position = this.cartesionPosition
        });
        const disposer2 = autorun(()=>{
            if(this.levelOfDetail===0){
                this.destroyLabel()
            }
           if(this.levelOfDetail>0){
               this.createLabel()
           }
        })
    }

    @computed get levelOfDetail(){
        const level = this.flightStore.geoLevelOfDetail.get(this.position.geohash);
        return level ? level : 0;
    }

    @computed get position(){
        return this.flightStore.flightPositions.get(this.icao)
    }

    @computed get cartesionPosition(){
        return convertPositionToCartesian(this.position)
    }

    @computed get demographics(){
        return this.flightStore.flightDemographics.get(this.icao)
    }

    @computed get labelText(){
        return `${this.icao}\n${this.demographics.origin}\n${this.demographics.destination}`
    }

    createPoint(){
        this.point = this.geoCollection.points.add({position: this.cartesionPosition, pixelSize: 2});
    }

    destroyPoint(){
        this.geoCollection.points.remove(this.point)
    }

    createLabel(){
        this.label = this.geoCollection.labels.add({text: this.labelText,
            font: '12px sans-serif',
            pixelOffset: labelOffset});
        this.label.position = this.cartesionPosition;
    }

    destroyLabel(){
        if(this.label){
            this.geoCollection.labels.remove(this.label);
            this.label = null;
        }
    }

    // createLabelText(dem: FlightDemographics){
    //
    // }
}

export class GeoCollection {
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