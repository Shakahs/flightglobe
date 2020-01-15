import { FlightPosition } from "../../../lib/types";
import { Cartesian3 } from "cesium";

export const convertPositionToCartesian = function(
   pos: FlightPosition
): Cartesian3 {
   return Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.altitude);
};

export const generateAPIURL = (pathname: string): string => {
   if (process.env.NODE_ENV === "development") {
      return `${window.location.origin}/api/${pathname}`;
   } else {
      return `${window.location.protocol}//data.flight.earth/api/${pathname}`;
   }
};
