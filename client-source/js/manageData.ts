import { forEach, has } from 'lodash-es';

import * as Cesium from 'cesium';

// import Cartesian3  from 'cesium/Source/Core/Cartesian3'
// const JulianDate = require('cesium/Source/Core/JulianDate')
// const CustomDataSource = require('cesium/Source/DataSources/CustomDataSource')

// import { Cartesian3, CustomDataSource} from 'cesium';
// import {JulianDate} from 'cesium';

import {entityMaker} from './flight';
import {
    FlightPosition,
    FlightPositionMap,
    Flight,
    FlightMap,
    FlightDemographics,
    DemographicsUpdate,
    Icao, PositionUpdate
} from "./types";
const isAfter = require('date-fns/is_after')

const scratchC3 = new Cesium.Cartesian3()
// const scratchJulian = JulianDate.now();

const retrieveFlight = (flightData: FlightMap, icao: Icao):Flight=>{
    let thisFlight = flightData.get(icao);
    if(!thisFlight){
        thisFlight = {icao, entity: undefined, demographics: undefined};
        flightData.set(icao, thisFlight)
    }
    return thisFlight
};

let newest = 0;
const labelDisplayCondition = new Cesium.DistanceDisplayCondition(0.0, 2000000);
const labelOffset = new Cesium.Cartesian2(10,20);
export const updatePlane = (flightData: FlightMap, cesiumPlaneData:Cesium.CustomDataSource, positionUpdate: PositionUpdate):number => {

  // const now = Cesium.JulianDate.now();
  // const future = Cesium.JulianDate.addSeconds(now, 30, Cesium.JulianDate.now());
    // const diff = DateTime
    //   .utc()
    //   .diff(DateTime.fromMillis(v.time * 1000, { zone: 'utc' }), 'seconds')
    //   .toObject();
    // console.log(`position age is ${ diff.seconds } seconds`);

    const newPosition = Cesium.Cartesian3.fromDegrees(
      positionUpdate.body.longitude,
      positionUpdate.body.latitude,
      positionUpdate.body.altitude,
      undefined,
      scratchC3
    );
    // const newDate = JulianDate.fromIso8601(
    //   DateTime.fromMillis(v.time * 1000, { zone: 'utc' }).toISO(),
    //   scratchJulian
    // );

    // let thisFlight = flightData.get(position.icao);
    // if(!thisFlight){
    //     thisFlight = {entity: undefined, demographics: undefined};
    //     flightData.set(position.icao, thisFlight)
    // }

    const thisFlight = retrieveFlight(flightData, positionUpdate.icao);

    if (thisFlight.entity) {
        thisFlight.entity.position = newPosition;
    } else {
        thisFlight.entity = entityMaker(cesiumPlaneData, positionUpdate, newPosition)
    }

    //apply demographics data if we have it
    if(!thisFlight.entity.label && thisFlight.demographics){
        thisFlight.entity.label = new Cesium.LabelGraphics(
            //@ts-ignore
            {text: `${thisFlight.icao}\n${thisFlight.demographics.origin}\n${thisFlight.demographics.destination}`, font: '12px sans-serif',
        //@ts-ignore
        distanceDisplayCondition: labelDisplayCondition, pixelOffset: labelOffset})
    }

    if(positionUpdate.body.timestamp > newest){
        newest = positionUpdate.body.timestamp
    }

    return newest
};

export const updateDemographics = (flightData: FlightMap, demographicsUpdate: DemographicsUpdate) => {
    const thisFlight = retrieveFlight(flightData, demographicsUpdate.icao);
    thisFlight.demographics = demographicsUpdate.body;
};
