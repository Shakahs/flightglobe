import * as Cesium from 'cesium';
// import {Cartesian3, CustomDataSource, Entity, JulianDate} from "cesium";

// export declare class Plane {
//     constructor(cesiumPlaneDataSource: Cesium.CustomDataSource, icao: Icao, position: Cesium.Cartesian3);
//
//     cesiumPlaneDataSource:Cesium.CustomDataSource;
//     entity: Cesium.Entity;
//     icao: Icao;
//
//     updatePosition(position: Cesium.Cartesian3, date: Cesium.JulianDate): void;
//     // myMethod(opts: MyClass.MyClassMethodOptions): number;
// }

export interface Plane {
    entity: Cesium.Entity
    track: Cesium.Cartesian3[]
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
    model: string
    origin: string
    destination: string
}

export type FlightPositions = FlightPosition[]

export type FlightPositionMap = { [icao:string]: FlightPosition }

export type PlaneMap = Map<string,Plane>
