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

export interface RedisFlightRecord {
   icao: string;
   position: FlightPosition;
   demographic: FlightDemographics;
   time?: Date;
}

export interface MasterFlightRecord {
   icao: string;
   latestPosition: FlightPosition;
   trackRecent: FlightPosition[];
   trackFull: FlightPosition[];
   demographic: FlightDemographics;
   updated?: Date;
}

export interface GeoPositionList {
   geohash: string;
   flights: {
      [k: string]: FlightPosition;
   };
}

export type GeoPositionListCollection = Map<string, GeoPositionList>;

export interface BootData {
   [k: string]: FlightRecord;
}

export type Geohash = string;
