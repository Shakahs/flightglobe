import { Icao } from "../client-source/js/types";

export const DS_GEOHASH_LIST_KEY = "geohashList";
export const DS_DEMOGRAPHICS_KEY = "demographics";

const DS_GEOHASHED_POSITIONS_PREFIX = "geohashedPositions";

export const generateGeohashedPositionsKey = (geohash: string) =>
   `${DS_GEOHASHED_POSITIONS_PREFIX}:${geohash}`;

const DS_TRACK_FULL_PREFIX = "trackFull";

export const generateTrackFullKey = (icao: Icao) =>
   `${DS_TRACK_FULL_PREFIX}:${icao}`;
