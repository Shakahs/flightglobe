import { Cartographic, Viewer } from "cesium";
import { Geohash, GeohashBoolMap } from "../../../lib/types";
import { forEach } from "lodash-es";
const GeohashLib = require("latlon-geohash");

export const getCameraPositionGeohash = (
   cameraPosition: Cartographic
): string => {
   return GeohashLib.encode(
      (cameraPosition.latitude * 180) / Math.PI,
      (cameraPosition.longitude * 180) / Math.PI,
      3
   );
};

export const getGeohashNeighbors = (g: Geohash): GeohashBoolMap => {
   const neighborList: GeohashBoolMap = new Map();
   neighborList.set(g, true);
   forEach(GeohashLib.neighbours(g), (neighbor) => {
      neighborList.set(neighbor, true);
   });
   return neighborList;
};
