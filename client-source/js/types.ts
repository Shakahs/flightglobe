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

export interface FlightRecord {
    Icao: string,
    Position: FlightPosition,
    Demographic: FlightDemographics,
    Time: string
}