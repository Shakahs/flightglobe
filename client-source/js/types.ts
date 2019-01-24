import * as Cesium from "cesium";

export interface FlightDemographics {
    icao?: string
    origin: string
    destination: string
    model: string
}

export type Icao = string

export interface FlightPosition  {
    timestamp: number,
    altitude: number
    latitude: number
    longitude: number
    heading: number
    geohash: string
}

export interface Message {
    type: "demographicUpdate" | "positionUpdate"
    body: any
    icao: Icao
}

export interface PositionUpdate extends Message {
    body: FlightPosition
}

export interface DemographicsUpdate extends Message {
    body: FlightDemographics
}

export interface FlightRecord {
    icao: string,
    positions: FlightPosition[],
    demographic: FlightDemographics,
    time?: Date
}

export interface UpdateRequest {
    lastReceivedTimestamp: number
}

interface ElementDisplayOptions {
    color: string
    cesiumColor: Cesium.Color
    size: number
}

export interface PointDisplayOptions extends ElementDisplayOptions {
    outlineColor: string
    outlineSize: number
}

export type PointDisplayOptionsUpdate = Partial<PointDisplayOptions>

export interface TrailDisplayOptions extends ElementDisplayOptions {
}

export type TrailDisplayOptionsUpdate = Partial<TrailDisplayOptions>

export interface LabelDisplayOptions extends ElementDisplayOptions  {
}

export type LabelDisplayOptionsUpdate = Partial<LabelDisplayOptions>

export interface AircraftModelData  {
    [model: string]: {
        name: string
    }
}
