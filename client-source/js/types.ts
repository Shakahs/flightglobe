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

export interface PointDisplayOptions {
    color: string
}