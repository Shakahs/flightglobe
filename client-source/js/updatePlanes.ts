import { forEach, has } from 'lodash-es';

import * as Cesium from 'cesium';

// import Cartesian3  from 'cesium/Source/Core/Cartesian3'
// const JulianDate = require('cesium/Source/Core/JulianDate')
// const CustomDataSource = require('cesium/Source/DataSources/CustomDataSource')

// import { Cartesian3, CustomDataSource} from 'cesium';
// import {JulianDate} from 'cesium';

import {planeMaker} from './plane';
import {FlightPosition, FlightPositionMap, PlaneMap} from "./types";
const isAfter = require('date-fns/is_after')

const scratchC3 = new Cesium.Cartesian3()
// const scratchJulian = JulianDate.now();
const knownPlanes:PlaneMap = {};

let newest:Date=new Date(2000,1,1);
const updatePlanes = (planeData: Cesium.CustomDataSource, data: FlightPosition[]):Date => {
  // const now = Cesium.JulianDate.now();
  // const future = Cesium.JulianDate.addSeconds(now, 30, Cesium.JulianDate.now());
    forEach(data, (v) => {
    // const diff = DateTime
    //   .utc()
    //   .diff(DateTime.fromMillis(v.time * 1000, { zone: 'utc' }), 'seconds')
    //   .toObject();
    // console.log(`position age is ${ diff.seconds } seconds`);

    const newPosition = Cesium.Cartesian3.fromDegrees(
      v.longitude,
      v.latitude,
      v.altitude,
      undefined,
      scratchC3
    );
    // const newDate = JulianDate.fromIso8601(
    //   DateTime.fromMillis(v.time * 1000, { zone: 'utc' }).toISO(),
    //   scratchJulian
    // );

    if (!has(knownPlanes, v.icao)) {
      knownPlanes[v.icao] = planeMaker(planeData, v.icao, newPosition);
    } else {
      knownPlanes[v.icao].updatePosition(newPosition);
    }

    if (isAfter(v.time, newest)){
        newest=v.time
    }

  });

    return newest
};

export default updatePlanes;
