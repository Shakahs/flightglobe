import * as Cesium from 'cesium';
// import {Cartesian3, CustomDataSource, Entity, JulianDate} from "cesium";

// export declare class Plane {
//     constructor(planeData: Cesium.CustomDataSource, icao: Icao, position: Cesium.Cartesian3);
//
//     planeData:Cesium.CustomDataSource;
//     entity: Cesium.Entity;
//     icao: Icao;
//
//     updatePosition(position: Cesium.Cartesian3, date: Cesium.JulianDate): void;
//     // myMethod(opts: MyClass.MyClassMethodOptions): number;
// }

export interface Plane {
    entity: Cesium.Entity;
    updatePosition: (position: Cesium.Cartesian3) => void;
}

export declare function updatePlanes(planeData: Cesium.CustomDataSource): any;
export type Icao = string

export interface FlightPosition  {
    icao: Icao,
    time: Date,
    altitude: number
    latitude: number
    longitude: number
    heading: number
}

export type FlightPositions = FlightPosition[]

export type FlightPositionMap = { [icao:string]: FlightPosition }

export type PlaneMap = { [icao:string]: Plane }