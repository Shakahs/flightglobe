import {action, configure, IReactionDisposer, observable, ObservableMap, reaction} from 'mobx';
import {
    DemographicsUpdate,
    FlightRecord,
    Icao,
    Message,
    PositionUpdate,
    PointDisplayOptions,
    PointDisplayOptionsUpdate
} from "./types";
import * as Cesium from "cesium";
import {newFlightRecord} from "./utility";
import {forEach, merge} from "lodash-es";
import {FlightObj} from "./flightObj";
import {GeoCollection} from "./geoCollection";
import WebsocketHandler from "./websocketHandler";

const Geohash = require('latlon-geohash');

configure({
    enforceActions: "observed"
});

export const PointDisplayOptionDefaults:PointDisplayOptions = {
    color: '#3399ff',
    size: 4,
    outlineColor: '#FFF',
    outlineSize: 1,
};

export class FlightStore {
    flightData = new ObservableMap<Icao, FlightRecord>(undefined,undefined, "flightData");
    detailedFlights = new ObservableMap<string, boolean>(undefined, undefined, "detailedFlights");
    filteredFlights = new ObservableMap<string, boolean>(undefined, undefined, "filteredFlights");
    selectedFlights = new ObservableMap<string, boolean>(undefined, undefined, "selectedFlights");
    geoAreas = new Map<Icao, GeoCollection>();
    flights = new Map<Icao, FlightObj>();
    @observable newestPositionTimestamp = 0;
    viewer:Cesium.Viewer;
    cameraEventDisposer:Cesium.Event.RemoveCallback;
    @observable pointDisplayOptions:PointDisplayOptions = PointDisplayOptionDefaults;

    constructor(viewer: Cesium.Viewer){
        this.viewer = viewer;
        this.cameraEventDisposer = viewer.camera.changed.addEventListener(() => {
          const ellipsoid = this.viewer.scene.globe.ellipsoid;
          const cameraPosition = ellipsoid.cartesianToCartographic(this.viewer.camera.position);
          const focusGeo = Geohash.encode(cameraPosition.latitude*180/Math.PI,
              cameraPosition.longitude*180/Math.PI, 3);
          const newGeoResult=new Map<string,boolean>();
          newGeoResult.set(focusGeo,true);
          this.detailedFlights.set(focusGeo, true);
          forEach(Geohash.neighbours(focusGeo), (neighbor)=>{
                newGeoResult.set(neighbor,true);
          })
          this.updateDetailedFlights(newGeoResult);
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

    @action('routeUpdate')
    routeUpdate(messages: Message[]){
        forEach(messages,(message)=>{
            switch (message.type) {
                case "positionUpdate":
                    const pUpdate = message as PositionUpdate;
                    this.addOrUpdateFlight(pUpdate);
                    break;
                case "demographicUpdate":
                    const dUpdate = message as DemographicsUpdate;
                    this.addDemographics(dUpdate);
                    break;
            }});
        this.viewer.scene.requestRender()
    }

    @action('addOrUpdateFlight')
    addOrUpdateFlight(pos: PositionUpdate){
        // this.flightPositions.set(pos.icao, pos.body);
        let flightRecord = this.flightData.get(pos.icao);
        if(flightRecord){
            flightRecord.positions.push(pos.body)
        } else {
            flightRecord = newFlightRecord(pos.icao);
            flightRecord.positions.push(pos.body);
            this.flightData.set(pos.icao, flightRecord)
        }

        const geoColl = this.getOrCreateGeoCollection(pos.body.geohash[0]);
        let thisFlight = this.flights.get(pos.icao);
        if(thisFlight && (thisFlight.geoCollection !== geoColl)){
            thisFlight.destroy();
            thisFlight = undefined;
        }
        if(!thisFlight){
            this.flights.set(pos.icao, new FlightObj(this, flightRecord, pos.icao, geoColl));
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
            currentData.demographic.origin = dem.body.origin;
            currentData.demographic.destination = dem.body.destination;
            currentData.demographic.model = dem.body.model;
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

    @action('updateDetailedFlights')
    updateDetailedFlights(selected: Map<string,boolean>){
        this.detailedFlights.replace(selected)
    }

    @action('updateLatestTimestamp')
    updateLatestTimestamp(pos:PositionUpdate){
        if(pos.body.timestamp > this.newestPositionTimestamp){
            this.newestPositionTimestamp = pos.body.timestamp
        }
    }

    @action('updatePointDisplay')
    updatePointDisplay(newOptions: PointDisplayOptionsUpdate){
        merge<PointDisplayOptions,PointDisplayOptionsUpdate>(this.pointDisplayOptions, newOptions);
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
        // this.cameraEventDisposer();
    }
}

