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
import {
    Cartesian3,
    Label,
    LabelCollection,
    LabelGraphics,
    PointPrimitive,
    PointPrimitiveCollection, PolylineCollection,
    Viewer
} from "cesium";

const labelOffset = new Cesium.Cartesian2(10, 20);

export class FlightStore {
    flightPositions = new ObservableMap<Icao, FlightPosition[]>(undefined,undefined, "positionmap");
    flightDemographics = new ObservableMap<Icao, FlightDemographics>();
    geoLevelOfDetail = new ObservableMap<string, number>(undefined, undefined, "geoLODmap");
    geoAreas = new Map<Icao, GeoCollection>();
    flights = new Map<Icao, FlightObj>();
    newestPositionTimestamp = 0;
    viewer:Cesium.Viewer;
    cameraEventDisposer:Cesium.Event.RemoveCallback;


    constructor(viewer: Cesium.Viewer){
        this.viewer = viewer;
        this.cameraEventDisposer = viewer.camera.changed.addEventListener(() => {
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
        const currentPositions = this.flightPositions.get(pos.icao);
        if(currentPositions){
            currentPositions.push(pos.body)
        } else {
            this.flightPositions.set(pos.icao, [pos.body])
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

    destroy(){
        this.flights.forEach((f)=>f.destroy());
        this.geoAreas.forEach((f)=>f.destroy());
        this.cameraEventDisposer();
    }
}

export class FlightObj {
    flightStore:FlightStore;
    icao:Icao;
    geoCollection:GeoCollection;
    point: null | PointPrimitive = null;
    label: null | Label = null;
    disposers: Array<IReactionDisposer>;

    constructor(flightStore, icao: Icao, geo){
        this.flightStore = flightStore;
        this.icao = icao;
        this.geoCollection = geo;

        const pointUpdater = autorun(()=>{
            const posList = this.flightStore.flightPositions.get(this.icao);
            if(posList){
                const newC3 = convertPositionToCartesian(posList[posList.length-1]);
                if(this.point){
                    this.point.position = newC3;
                } else {
                    this.point = this.geoCollection.points.add({
                        position: newC3,
                        pixelSize: 2,
                        id: this.icao
                    });
                }
            }
        },{name:'visibilityupdater'});

        const labelUpdater = autorun(()=>{
            const posList = this.flightStore.flightPositions.get(this.icao);
            const shouldBeVisible = this.shouldLabelDisplay;
            const labelText = this.labelText;
            if(shouldBeVisible && posList){
                const newC3 = convertPositionToCartesian(posList[posList.length-1]);
                if(this.label){
                    this.label.position = newC3;
                } else {
                    this.label = this.geoCollection.labels.add({
                        position: newC3,
                        text: labelText,
                        font: '12px sans-serif',
                        pixelOffset: labelOffset,
                    });
                }
            } else {
                this.destroyLabel()
            }
        },{name:'visibilityupdater'});

        this.disposers = [pointUpdater];
    }

    @computed get levelOfDetail():number {
        if(this.latestPosition){
            const level = this.flightStore.geoLevelOfDetail.get(this.latestPosition.geohash);
            return level ? level : 0;
        }
        return 0;
    }

    @computed get latestPosition():FlightPosition|null {
        const posList = this.flightStore.flightPositions.get(this.icao);
        if(posList){
            return posList[posList.length-1];
        }
        return null
    }

    @computed get cartesianPosition():Cartesian3|null {
        if(this.latestPosition){
            return convertPositionToCartesian(this.latestPosition)
        }
        return null
    }

    @computed get demographics():FlightDemographics|undefined {
        return this.flightStore.flightDemographics.get(this.icao)
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
}

export class GeoCollection {
    id: string;
    points: PointPrimitiveCollection;
    labels: LabelCollection;
    lines: PolylineCollection;
    viewer: Viewer;

    constructor(id: string, viewer: Cesium.Viewer){
        this.id = id;
        this.viewer = viewer;
        this.points = new Cesium.PointPrimitiveCollection();
        this.labels = new Cesium.LabelCollection();
        this.lines = new Cesium.PolylineCollection();
        viewer.scene.primitives.add(this.points);
        viewer.scene.primitives.add(this.labels);
        viewer.scene.primitives.add(this.lines);
    }

    destroy(){
        this.points.destroy();
        this.labels.destroy()
    }
}