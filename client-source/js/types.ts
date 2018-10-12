import {Icao} from "./types";
import * as Cesium from 'cesium';

export * from './types'
// import {Cartesian3, CustomDataSource, Entity, JulianDate} from "cesium";

export declare class Plane {
    constructor(planeData: Cesium.CustomDataSource, icao: Icao, position: Cesium.Cartesian3);

    planeData:Cesium.CustomDataSource;
    entity: Cesium.Entity;
    icao: Icao;

    public updatePosition(position: Cesium.Cartesian3, date: Cesium.JulianDate): void;
    // myMethod(opts: MyClass.MyClassMethodOptions): number;
}

export declare function updatePlanes(planeData: Cesium.CustomDataSource): any;
export type Icao = string

export interface FlightPosition extends Coordinates {
    icao: Icao,
    time: Date,
    altitude: number
}

export type FlightPositions = FlightPosition[]

export type FlightPositionMap = { [icao:string]: FlightPosition }

export type PlaneMap = { [icao:string]: Plane }