import {Cartesian3} from "cesium";
import * as Cesium from "cesium";
import {FlightPosition} from "./types";

const scratchC3 = new Cartesian3();
export const convertPositionToCartesian = function(pos:FlightPosition):Cesium.Cartesian3 {
    return Cesium.Cartesian3.fromDegrees(
        pos.longitude,
        pos.latitude,
        pos.altitude
    );
};
