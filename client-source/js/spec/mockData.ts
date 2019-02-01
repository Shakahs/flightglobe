import {DemographicsUpdate, PositionUpdate} from "../types";

export const FlightAPosition1: PositionUpdate = {
    body: {
        timestamp: Date.now(),
        altitude: 9000,
        latitude: 55,
        longitude: 33,
        heading: 100,
        geohash: "u9z"
    },
    type: "positionUpdate",
    icao: "ABCDEF"
};
export const FlightAPosition2: PositionUpdate = {
    body: {
        timestamp: Date.now(),
        altitude: 10000,
        latitude: 55,
        longitude: 34,
        heading: 101,
        geohash: "ucb"
    },
    type: "positionUpdate",
    icao: "ABCDEF"
};
export const FlightADemographic: DemographicsUpdate = {
    type: "demographicUpdate",
    icao: "ABCDEF",
    body: {
        origin: "Los Angeles",
        destination: "Tokyo",
        model: "B747"
    }
};
export const FlightBPosition1: PositionUpdate = {
    body: {
        timestamp: Date.now(),
        altitude: 9000,
        latitude: 22,
        longitude: -33,
        heading: 100,
        geohash: "e7b"
    },
    type: "positionUpdate",
    icao: "BCDEF"
};
export const FlightCPosition1: PositionUpdate = {
    body: {
        timestamp: Date.now(),
        altitude: 9000,
        latitude: 11,
        longitude: 11,
        heading: 100,
        geohash: "s1z"
    },
    type: "positionUpdate",
    icao: "ZZZF"
};
export const FlightCDemographic: DemographicsUpdate = {
    type: "demographicUpdate",
    icao: "ZZZF",
    body: {
        origin: "Los Angeles",
        destination: "Tokyo",
        model: "B747"
    }
};