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
    icao?: string
    origin: string
    destination: string
    model: string
}

export interface Flight {
    icao: Icao
    point: Cesium.PointPrimitive | undefined
    demographics: FlightDemographics | undefined
    geohash: string | undefined
}

export declare function updatePlanes(planeData: Cesium.CustomDataSource): any;
export type Icao = string

export interface FlightPosition  {
    timestamp: number,
    altitude: number
    latitude: number
    longitude: number
    heading: number
    geohash: string
}

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

export type GeoMap = Map<string,Cesium.PointPrimitiveCollection>

// type FlightRecord struct {
//     Icao        string
//     Position    Position
//     Demographic Demographic
//     Time        time.Time
// }

export interface FlightRecord {
    Icao: string,
    Position: FlightPosition,
    Demographic: FlightDemographics,
    Time: string
}