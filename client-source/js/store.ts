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
    geoLevelOfDetail = new ObservableMap<string, number>(undefined, undefined, "geoLODMap");
    filterResult = new ObservableMap<string, boolean>(undefined, undefined, "filterResultMap");
    geoAreas = new Map<Icao, GeoCollection>();
    flights = new Map<Icao, FlightObj>();
    newestPositionTimestamp = 0;
    viewer:Cesium.Viewer;
    cameraEventDisposer:Cesium.Event.RemoveCallback;
    @observable selectedFlight:string = '';
    @observable.ref displayedDemographics:FlightDemographics[] = [];
    disposer:IReactionDisposer

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

        this.disposer = reaction(
            ()=>{
                const newData:FlightDemographics[]=[];
                for(let e of this.flightData.entries()){
                    if(e[1].demographic){
                        newData.push({
                            icao:e[0],
                            origin: e[1].demographic.origin,
                            destination: e[1].demographic.destination,
                            model: e[1].demographic.model
                        })
                    }
                }
                return newData
            },
            (newData)=>{
                this.displayedDemographics = newData;
            },
            {delay: 2000}
        )
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
        this.filterResult.replace(filtered)
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

        const visibilityUpdater = autorun(()=>{
            const shouldDisplay = this.shouldDisplay
            if(shouldDisplay){
                if (this.point){
                    this.point.show = true
                }
            } else {
                if (this.point){
                    this.point.show = false
                }
            }
        }, {name: 'visibilityUpdater'});

        const pointUpdater = autorun(()=>{
            const flightRecord = this.flightStore.flightData.get(this.icao);
            if(flightRecord){
                const newC3 = convertPositionToCartesian(flightRecord.positions[flightRecord.positions.length-1]);
                if(this.point){
                    this.point.position = newC3;
                } else {
                    this.point = this.geoCollection.points.add({
                        position: newC3,
                        pixelSize: 4,
                        id: this.icao
                    });
                }
            }
        },{name:'pointUpdater'});

        const trailUpdater = autorun(()=>{
            const shouldBeVisible = this.shouldTrailDisplay;
            const positions = this.trailPositions;
            if(shouldBeVisible && positions.length>0){
                if(this.trail){
                    this.trail.positions = positions;
                } else {
                    const polyLine = {
                        positions: positions,
                        id: this.icao
                    };
                    this.trail = this.geoCollection.lines.add(polyLine);
                }
            } else {
                this.destroyTrail()
            }
        },{name:'trailUpdater'});

        const labelUpdater = autorun(()=>{
            const flightRecord = this.flightStore.flightData.get(this.icao);
            const shouldBeVisible = this.shouldLabelDisplay;
            const labelText = this.labelText;
            if(shouldBeVisible && flightRecord && flightRecord.positions.length>0){
                const newC3 = convertPositionToCartesian(flightRecord.positions[flightRecord.positions.length-1]);
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
        },{name:'labelUpdater'});

        this.disposers = [pointUpdater,labelUpdater];
    }

    @computed get levelOfDetail():number {
        if(this.isSelected){return 1}
        if(this.latestPosition){
            const level = this.flightStore.geoLevelOfDetail.get(this.latestPosition.geohash);
            return level ? level : 0;
        }
        return 0;
    }

    @computed get isSelected():boolean {
        return this.icao === this.flightStore.selectedFlight;
    }

    @computed get latestPosition():FlightPosition|null {
        const flightRecord = this.flightStore.flightData.get(this.icao);
        if(flightRecord){
            return flightRecord.positions[flightRecord.positions.length-1];
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
        const flightRecord = this.flightStore.flightData.get(this.icao);
        if(flightRecord){
            return flightRecord.demographic
        }
        return undefined
    }

    @computed get shouldDisplay():boolean {
        if(this.flightStore.filterResult.size > 0){
            return this.flightStore.filterResult.has(this.icao)
        }
        return true
    }

    destroyPoint(){
        if(this.point){
            this.geoCollection.points.remove(this.point);
            this.point = null;
        }
    }

    @computed get shouldTrailDisplay(){
        return this.levelOfDetail >= 1;
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
        const flightRecord = this.flightStore.flightData.get(this.icao);
        let subPosList:FlightPosition[] = [];
        if(flightRecord && flightRecord.positions && flightRecord.positions.length <= 5){
            subPosList = flightRecord.positions;
        } else if(flightRecord) {
            subPosList = this.isSelected ? flightRecord.positions : flightRecord.positions.slice(flightRecord.positions.length-5)
        }
        return subPosList.map((p)=>convertPositionToCartesian(p))
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