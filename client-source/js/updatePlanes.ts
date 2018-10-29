import { forOwn, has } from 'lodash-es';

import * as Cesium from 'cesium';

// import Cartesian3  from 'cesium/Source/Core/Cartesian3'
// const JulianDate = require('cesium/Source/Core/JulianDate')
// const CustomDataSource = require('cesium/Source/DataSources/CustomDataSource')

// import { Cartesian3, CustomDataSource} from 'cesium';
// import {JulianDate} from 'cesium';

import {planeMaker} from './plane';
import {FlightPosition, FlightPositionMap, PlaneMap} from "./types";

const scratchC3 = new Cesium.Cartesian3()
// const scratchJulian = JulianDate.now();
const knownPlanes:PlaneMap = {};


const updatePlanes = (planeData: Cesium.CustomDataSource, data: FlightPosition):void => {
  // const now = Cesium.JulianDate.now();
  // const future = Cesium.JulianDate.addSeconds(now, 30, Cesium.JulianDate.now());

  // forOwn(data, (v, icao) => {
    // const diff = DateTime
    //   .utc()
    //   .diff(DateTime.fromMillis(v.time * 1000, { zone: 'utc' }), 'seconds')
    //   .toObject();
    // console.log(`position age is ${ diff.seconds } seconds`);

    const newPosition = Cesium.Cartesian3.fromDegrees(
      data.longitude,
      data.latitude,
      data.altitude,
      undefined,
      scratchC3
    );
    // const newDate = JulianDate.fromIso8601(
    //   DateTime.fromMillis(v.time * 1000, { zone: 'utc' }).toISO(),
    //   scratchJulian
    // );

    if (!has(knownPlanes, data.icao)) {
      knownPlanes[data.icao] = planeMaker(planeData, data.icao, newPosition);
    } else {
      knownPlanes[data.icao].updatePosition(newPosition);
    }
  // });
};

export default updatePlanes;
