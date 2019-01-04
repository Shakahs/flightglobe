import {
    computed,
    observable,
    observe,
    get,
    autorun,
    IObjectDidChange,
    IReactionDisposer,
    ObservableMap,
    trace, toJS, reaction,
    configure, action
} from 'mobx';
import {
    DemographicsUpdate,
    FlightDemographics,
    FlightPosition,
    FlightRecord,
    Icao,
    PositionUpdate
} from "./types";
import * as Cesium from "cesium";
import {convertPositionToCartesian, newFlightRecord} from "./utility";
const Geohash = require('latlon-geohash');
import {forEach,has} from "lodash-es";
import {
    Cartesian3,
    Label,
    LabelCollection,
    LabelGraphics,
    PointPrimitive,
    PointPrimitiveCollection, Polyline, PolylineCollection,
    Viewer
} from "cesium";

configure({
    enforceActions: "observed"
});

const labelOffset = new Cesium.Cartesian2(10, 20);

export class FlightStore {
    flightData = new ObservableMap<Icao, FlightRecord>(undefined,undefined, "flightData");
    detailedFlights = new ObservableMap<string, boolean>(undefined, undefined, "detailedFlights");
    filteredFlights = new ObservableMap<string, boolean>(undefined, undefined, "filteredFlights");
    selectedFlights = new ObservableMap<string, boolean>(undefined, undefined, "selectedFlights");
    geoAreas = new Map<Icao, GeoCollection>();
    flights = new Map<Icao, FlightObj>();
    newestPositionTimestamp = 0;
    viewer:Cesium.Viewer;
    cameraEventDisposer:Cesium.Event.RemoveCallback;

    constructor(viewer: Cesium.Viewer){
        this.viewer = viewer;
        // this.cameraEventDisposer = viewer.camera.changed.addEventListener(() => {
        //   const ellipsoid = this.viewer.scene.globe.ellipsoid;
        //   const cameraPosition = ellipsoid.cartesianToCartographic(this.viewer.camera.position);
        //   const focusGeo = Geohash.encode(cameraPosition.latitude*180/Math.PI,
        //       cameraPosition.longitude*180/Math.PI, 3);
        //     this.detailedFlights.clear();
        //     this.detailedFlights.set(focusGeo, true);
        //     forEach(Geohash.neighbours(focusGeo), (neighbor)=>{
        //         this.detailedFlights.set(neighbor, true);
        //     })
        // });
    }

    getOrCreateGeoCollection(id: string):GeoCollection{
        let geo = this.geoAreas.get(id);
        if(!geo){
            geo = new GeoCollection(id, this.viewer);
            this.geoAreas.set(id, geo)
        }
        return geo
    }

    @action('addOrUpdateFlight')
    addOrUpdateFlight(pos: PositionUpdate){
        // this.flightPositions.set(pos.icao, pos.body);
        const currentData = this.flightData.get(pos.icao);
        if(currentData){
            currentData.positions.push(pos.body)
        } else {
            const newData = newFlightRecord(pos.icao);
            newData.positions.push(pos.body);
            this.flightData.set(pos.icao, newData)
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

    // @action('importTrack')
    // importTrack(track: FlightRecord[]){
    //     const icao = track[0].Icao;
    //     const newPositions:FlightPosition[] = [];
    //     track.forEach((t)=>{
    //         newPositions.push(t.Position[0])
    //     });
    //     this.flightPositions.set(icao,newPositions)
    // }

    @action('addDemographics')
    addDemographics(dem: DemographicsUpdate){
        const currentData = this.flightData.get(dem.icao);
        if(currentData){
            currentData.demographic=dem.body;
        } else {
            const newData = newFlightRecord(dem.icao);
            newData.demographic=dem.body
            this.flightData.set(dem.icao, newData)
        }
    }

    @action('updateFilteredFlights')
    updateFilteredFlights(filtered: Map<string,boolean>){
        this.filteredFlights.replace(filtered)
    }

    @action('updateSelectedFlight')
    updateSelectedFlight(selected: Map<string,boolean>){
        this.selectedFlights.replace(selected)
    }

    updateLatestTimestamp(pos:PositionUpdate){
        this.newestPositionTimestamp = (this.newestPositionTimestamp > pos.body.timestamp) ?
            this.newestPositionTimestamp : pos.body.timestamp;
    }

    numberFlights():number {
        return this.flightData.size
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
    trail: null | Polyline = null;
    label: null | Label = null;
    disposers: Array<IReactionDisposer>;

    constructor(flightStore, icao: Icao, geo){
        this.flightStore = flightStore;
        this.icao = icao;
        this.geoCollection = geo;

        const pointVisibilityUpdater = autorun(()=>{
            const shouldDisplay = this.shouldDisplay;
            if(this.point && shouldDisplay){this.point.show=true}
            else if(this.point && !shouldDisplay){this.point.show=false}
        }, {name: 'pointVisibilityUpdater'});

        const pointUpdater = autorun(()=>{
            const newPosition = this.cartesianPosition;
            const shouldDisplay = this.shouldDisplay;
            if(newPosition){
                this.renderPoint(newPosition,shouldDisplay)
            }
        },{name:'pointUpdater'});

        const trailUpdater = autorun(()=>{
            const shouldTrailDisplay = this.shouldTrailDisplay;
            const positions = this.trailPositions;
            if(shouldTrailDisplay){
                this.renderTrail(positions)
            } else {
                this.destroyTrail()
            }
        },{name:'trailUpdater'});

        const labelUpdater = autorun(()=>{
            const shouldLabelDisplay = this.shouldLabelDisplay;
            const labelText = this.labelText;
            const newPosition = this.cartesianPosition;
            if(shouldLabelDisplay && newPosition){
                this.renderLabel(newPosition, labelText)
            } else {
                this.destroyLabel()
            }
        },{name:'labelUpdater'});

        this.disposers = [pointVisibilityUpdater,pointUpdater,trailUpdater,labelUpdater];
    }

    // common

    @computed get isSelected():boolean {
        return this.flightStore.selectedFlights.has(this.icao);
    }

    @computed get isDetailSelected():boolean {
        if(this.latestPosition){ //selected by LOD
            return this.flightStore.detailedFlights.has(this.latestPosition.geohash);
        }
        return false
    }

    @computed get isFilterSelected():boolean {
        if(this.flightStore.detailedFlights.size === 0){
            return true //the default filter is to include everything
        }
        return this.flightStore.detailedFlights.has(this.icao); //otherwise, return the actual filter result
    }

    @computed get shouldDisplay():boolean {
        return this.isSelected || this.isFilterSelected
    }

    @computed get shouldDisplayDetailed():boolean {
        if(this.isSelected){return true} //selected by user
        return this.isDetailSelected && this.isFilterSelected //has to qualify for boths
    }

    @computed get demographics():FlightDemographics|undefined {
        const flightRecord = this.flightStore.flightData.get(this.icao);
        if(flightRecord){
            return flightRecord.demographic
        }
        return undefined
    }

    // position

    @computed get allPositions():FlightPosition[] {
        const flightRecord = this.flightStore.flightData.get(this.icao);
        if(flightRecord){
            return flightRecord.positions;
        }
        return []
    }

    @computed get latestPosition():FlightPosition|null {
        if(this.allPositions.length>0){
            return this.allPositions[this.allPositions.length-1];
        }
        return null
    }

    @computed get cartesianPosition():Cartesian3|null {
        if(this.latestPosition){
            return convertPositionToCartesian(this.latestPosition)
        }
        return null
    }

    // points

    renderPoint(pos: Cartesian3, visibility: boolean){
        if(this.point){
            this.point.position = pos;
        } else {
            this.point = this.geoCollection.points.add({
                position: pos,
                pixelSize: 4,
                id: this.icao,
                show: visibility
            });
        }
    }

    destroyPoint(){
        if(this.point){
            this.geoCollection.points.remove(this.point);
            this.point = null;
        }
    }

    // trails

    @computed get shouldTrailDisplay():boolean{
        return this.allPositions.length>=1 && this.shouldDisplayDetailed
    }

    renderTrail(positions: Cartesian3[]){
        const polyLine = {
            positions: positions,
            id: this.icao
        };
        this.trail = this.geoCollection.lines.add(polyLine);
    }

    destroyTrail(){
        if(this.trail){
            this.geoCollection.lines.remove(this.trail);
            this.trail = null;
        }
    }

    //depending on the length of the available position history, and this points selection status
    //return the whole position history or the last 5 positions
    @computed get trailPositions():Cartesian3[]{
        let subPosList:FlightPosition[] = [];
        if(this.isSelected || this.allPositions.length <= 5){
            subPosList = this.allPositions;
        } else {
            subPosList = this.allPositions.slice(this.allPositions.length-5)
        }
        return subPosList.map((p)=>convertPositionToCartesian(p))
    }

    // labels

    @computed get shouldLabelDisplay(){
        return this.shouldDisplayDetailed;
    }

    @computed get labelText(){
        if(this.demographics){
            return `${this.icao}\n${this.demographics.origin}\n${this.demographics.destination}`
        } else {
            return ''
        }
    }

    renderLabel(pos: Cartesian3, labelText: string){
        if(this.label){
            this.label.position = pos;
        } else {
            this.label = this.geoCollection.labels.add({
                position: pos,
                text: labelText,
                font: '12px sans-serif',
                pixelOffset: labelOffset,
            });
        }
    }

    destroyLabel(){
        if(this.label){
            this.geoCollection.labels.remove(this.label);
            this.label = null;
        }
    }

    // cleanup

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