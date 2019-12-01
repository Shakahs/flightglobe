import { Cartesian3 } from "cesium";
import { FlightPosition, FlightRecord, Icao } from "../../../lib/types";

const scratchC3 = new Cartesian3();
export const convertPositionToCartesian = function(
   pos: FlightPosition
): Cartesian3 {
   return Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.altitude);
};

export const newFlightRecord = function(icao: Icao): FlightRecord {
   return {
      icao,
      positions: [],
      demographic: { origin: "", destination: "", model: "" }
   };
};

export const newICAOMap = function(icaos: Icao[]): Map<Icao, boolean> {
   const resMap = new Map<Icao, boolean>();
   icaos.forEach((icao) => {
      resMap.set(icao, true);
   });
   return resMap;
};
