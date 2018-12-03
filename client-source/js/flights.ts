import {
    computed,
    observable,
    observe,
    get,
    autorun,
    IObjectDidChange,
    IReactionDisposer,
    ObservableMap,
    trace
} from 'mobx';
import {DemographicsUpdate, Flight, FlightDemographics, FlightPosition, GeoMap, Icao, PositionUpdate} from "./types";
import * as Cesium from "cesium";
import {convertPositionToCartesian} from "./utility";
const Geohash = require('latlon-geohash');
import {forEach} from "lodash-es";
import {Cartesian3, Label, LabelGraphics, PointPrimitive} from "cesium";

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
    @observable flightPositions = new ObservableMap<Icao, FlightPosition>();
    @observable flightDemographics = new ObservableMap<Icao, FlightDemographics>();
    @observable geoLevelOfDetail = new ObservableMap<string, number>();
    geoAreas = new Map<Icao, GeoCollection>();
    flights = new Map<Icao, FlightObj>();
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
            this.geoLevelOfDetail.set(focusGeo, 1)
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
        // this.flightPositions.set(pos.icao, pos.body);
        const currentPosition = this.flightPositions.get(pos.icao);
        if(currentPosition){
            Object.assign(currentPosition, pos.body)
        } else {
            this.flightPositions.set(pos.icao, pos.body)
        }

        const geoColl = this.getOrCreateGeoCollection(pos.body.geohash[0]);
        let thisFlight = this.flights.get(pos.icao);
        if(thisFlight && (thisFlight.geoCollection !== geoColl)){
            thisFlight.destroy();
            thisFlight = undefined;
        }
        if(!thisFlight){
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

    numberFlights():number {
        return this.flightPositions.size
    }

    numberGeos():number {
        return this.geoAreas.size
    }
}
const labelOffset = new Cesium.Cartesian2(10, 20);
const labelDisplayCondition = new Cesium.DistanceDisplayCondition(0.0, 2000000);

export class FlightObj {
    flightStore:FlightStore;
    icao:Icao;
    geoCollection:GeoCollection;
    point: null | PointPrimitive = null;
    label: null | Label = null;
    disposers: Array<IReactionDisposer>;
    @observable rootPosition: FlightPosition;
    // levelOfDetail;


    constructor(flightStore, icao: Icao, geo){
        this.flightStore = flightStore;
        this.icao = icao;
        this.geoCollection = geo;
        this.rootPosition = this.flightStore.flightPositions.get(this.icao) as FlightPosition;

        // const positionUpdater = autorun(()=>{
        //     this.primitives.forEach((p)=>{
        //         if(p && this.cartesianPosition){p.position = this.cartesianPosition}
        //     })
        // });

        const visiblePrimitiveUpdater = autorun(()=>{
            if(this.shouldPointDisplay && this.cartesianPosition){
                this.createOrUpdatePoint(this.cartesianPosition)
            } else {
                this.destroyPoint()
            }

            if(this.shouldLabelDisplay){
                this.createLabel()
            } else {
                this.destroyLabel()
            }

        });

        const asdasd = autorun(()=>{
            const newC3 = Cesium.Cartesian3.fromDegrees(
                this.rootPosition.longitude,
                this.rootPosition.latitude,
                this.rootPosition.altitude,
            );
            this.whatever(newC3)
        })

        this.disposers = [visiblePrimitiveUpdater];
    }

    whatever(input: Cartesian3){
        console.log(input.toString())
    }

    @computed get levelOfDetail():number {
        if(this.position){
            const level = this.flightStore.geoLevelOfDetail.get(this.position.geohash);
            return level ? level : 0;
        }
        return 0;
    }

    @computed get position():FlightPosition|undefined {
        return this.flightStore.flightPositions.get(this.icao)
    }

    @computed get cartesianPosition():Cartesian3|null {
        if(this.position){
            return convertPositionToCartesian(this.position)
        }
        return null
    }

    @computed get demographics():FlightDemographics|undefined {
        return this.flightStore.flightDemographics.get(this.icao)
    }
    
    @computed get shouldPointDisplay():boolean {
        return true
    }

    createOrUpdatePoint(pos: Cesium.Cartesian3){
        if(this.point){
            this.point.position = pos
        } else {
            this.point = this.geoCollection.points.add({
                position: pos,
                pixelSize: 2,
                id: this.icao
            });
        }
    }

    destroyPoint(){
        if(this.point){
            this.geoCollection.points.remove(this.point);
            this.point = null;
        }
    }

    @computed get shouldLabelDisplay(){
        return this.levelOfDetail >= 1;
    }

    @computed get labelText(){
        if(this.demographics){
            return `${this.icao}\n${this.demographics.origin}\n${this.demographics.destination}`
        } else {
            return ''
        }
    }

    createLabel(){
        if(!this.label){
            this.label = this.geoCollection.labels.add({
                text: this.labelText,
                font: '12px sans-serif',
                pixelOffset: labelOffset,
                position: this.cartesianPosition
            });
        }
    }

    destroyLabel(){
        if(this.label){
            this.geoCollection.labels.remove(this.label);
            this.label = null;
        }
    }

    destroy(){
        this.destroyPoint();
        this.destroyLabel();
        //call each disposer function to destroy the MobX reaction, otherwise this is a memory leak
        this.disposers.forEach((d)=>{d()})
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