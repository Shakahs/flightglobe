import * as Cesium from 'cesium';
// import {Cartesian3, CustomDataSource, Entity, JulianDate} from "cesium";

// export declare class Flight {
//     constructor(cesiumPlaneDataSource: Cesium.CustomDataSource, icao: Icao, position: Cesium.Cartesian3);
//
//     cesiumPlaneDataSource:Cesium.CustomDataSource;
//     entity: Cesium.Entity;
//     icao: Icao;
//
//     updatePosition(position: Cesium.Cartesian3, date: Cesium.JulianDate): void;
//     // myMethod(opts: MyClass.MyClassMethodOptions): number;
// }

export interface FlightDemographics {
    origin: string
    destination: string
    model: string
}

export interface Flight {
    entity: Cesium.Entity | undefined
    demographics: FlightDemographics | undefined
}

export declare function updatePlanes(planeData: Cesium.CustomDataSource): any;
export type Icao = string

export interface FlightPosition  {
    time: Date,
    altitude: number
    latitude: number
    longitude: number
    heading: number
}

export type FlightPositions = FlightPosition[]

export type FlightPositionMap = { [icao:string]: FlightPosition }

export type FlightMap = Map<string,Flight>

export interface Message {
    type: string
    body: any
    icao: Icao
}

export interface PositionUpdate extends Message {
    body: FlightPosition
}

export interface DemographicsUpdate extends Message {
    body: FlightDemographics
}