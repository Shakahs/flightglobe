import {Flight, FlightMap, FlightPosition, Icao} from "../types";
import * as Cesium from "cesium";
import {Cartesian3} from "cesium";

const labelDisplayCondition = new Cesium.DistanceDisplayCondition(0.0, 2000000);
const labelOffset = new Cesium.Cartesian2(10,20);

export const getOrCreateFlight = (flightData: FlightMap, icao: Icao): Flight => {
    let thisFlight = flightData.get(icao);
    if (!thisFlight) {
        thisFlight = {icao, point: undefined, demographics: undefined, geohash: undefined};
        flightData.set(icao, thisFlight)
    }
    return thisFlight
};
const createLabel = (thisFlight: Flight): Cesium.LabelGraphics => {
    return new Cesium.LabelGraphics(
        //@ts-ignore
        {
            // text: `${thisFlight.icao}\n${thisFlight.demographics.origin}\n${thisFlight.demographics.destination}`,
            text: `${thisFlight.icao}`,
            font: '12px sans-serif',
            //@ts-ignore
            distanceDisplayCondition: labelDisplayCondition,
            pixelOffset: labelOffset
        })
};
export const createPoint = function (pos: Cesium.Cartesian3) {
    return {position: pos, pixelSize: 2}
};

const scratchC3 = new Cartesian3();
export const convertPositionToCartesian = function(pos:FlightPosition):Cesium.Cartesian3 {
    return Cesium.Cartesian3.fromDegrees(
        pos.longitude,
        pos.latitude,
        pos.altitude,
        undefined,
        scratchC3
    );
};