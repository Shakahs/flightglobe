export const DS_GEOHASH_LIST_KEY = "geohashList";

const DS_GEOHASHED_POSITIONS_PREFIX = "geohashedPositions";

export const generateGeohashedPositionsKey = (geohash: string) =>
   `${DS_GEOHASHED_POSITIONS_PREFIX}:${geohash}`;
