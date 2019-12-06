import { FlightPosition } from "../../../lib/types";
import { Cartesian3 } from "cesium";

export const convertPositionToCartesian = function(
   pos: FlightPosition
): Cartesian3 {
   return Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.altitude);
};
