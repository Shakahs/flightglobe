export interface FlightDemographics {
   icao?: string;
   origin: string;
   destination: string;
   model: string;
}

export interface FlightPosition {
   timestamp: number;
   altitude: number;
   latitude: number;
   longitude: number;
   heading: number;
   geohash: string;
}

export interface FlightRecord {
   icao: string;
   positions: FlightPosition[];
   demographic: FlightDemographics;
   time?: Date;
}

export interface DeepstreamFlightRecord {
   icao: string;
   latestPosition: FlightPosition;
   trackRecent: FlightPosition[];
   trackFull: FlightPosition[];
   demographic: FlightDemographics;
   updated?: Date;
}

export interface BootData {
   [k: string]: FlightRecord;
}
