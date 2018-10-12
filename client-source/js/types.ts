import {Plane} from "./index";

export type Icao = string

export interface FlightPosition extends Coordinates {
    icao: Icao,
    time: Date,
    altitude: number
}

export type FlightPositions = FlightPosition[]

export type FlightPositionMap = { [icao:string]: FlightPosition }

export type PlaneMap = { [icao:string]: Plane }