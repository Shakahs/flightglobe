import {DemographicsUpdate, PositionUpdate} from "../types";

export const FlightAPosition1: PositionUpdate = {
    body: {
        timestamp: Date.now(),
        altitude: 9000,
        latitude: 55,
        longitude: 33,
        heading: 100,
        geohash: "abc"
    },
    type: "positionUpdate",
    icao: "ABCDEF"
};
export const FlightAPosition2: PositionUpdate = {
    body: {
        timestamp: Date.now(),
        altitude: 10000,
        latitude: 1,
        longitude: 1,
        heading: 101,
        geohash: "abc"
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
        latitude: 55,
        longitude: 33,
        heading: 100,
        geohash: "bcd"
    },
    type: "positionUpdate",
    icao: "BCDEF"
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