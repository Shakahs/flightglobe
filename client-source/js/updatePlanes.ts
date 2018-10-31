import { forEach, has } from 'lodash-es';

import * as Cesium from 'cesium';

// import Cartesian3  from 'cesium/Source/Core/Cartesian3'
// const JulianDate = require('cesium/Source/Core/JulianDate')
// const CustomDataSource = require('cesium/Source/DataSources/CustomDataSource')

// import { Cartesian3, CustomDataSource} from 'cesium';
// import {JulianDate} from 'cesium';

import {flightMaker} from './plane';
import {FlightPosition, FlightPositionMap, Flight, FlightMap} from "./types";
const isAfter = require('date-fns/is_after')

const scratchC3 = new Cesium.Cartesian3()
// const scratchJulian = JulianDate.now();


let newest:Date=new Date(2000,1,1);
const updatePlanes = (flightData: FlightMap, cesiumPlaneData:Cesium.CustomDataSource, position: FlightPosition):Date => {
  // const now = Cesium.JulianDate.now();
  // const future = Cesium.JulianDate.addSeconds(now, 30, Cesium.JulianDate.now());
    // const diff = DateTime
    //   .utc()
    //   .diff(DateTime.fromMillis(v.time * 1000, { zone: 'utc' }), 'seconds')
    //   .toObject();
    // console.log(`position age is ${ diff.seconds } seconds`);

    const newPosition = Cesium.Cartesian3.fromDegrees(
      position.longitude,
      position.latitude,
      position.altitude,
      undefined,
      scratchC3
    );
    // const newDate = JulianDate.fromIso8601(
    //   DateTime.fromMillis(v.time * 1000, { zone: 'utc' }).toISO(),
    //   scratchJulian
    // );

    const thisPlane = flightData.get(position.icao);
    if (thisPlane) {
        thisPlane.entity.position = newPosition;
    } else {
        flightData.set(position.icao, flightMaker(cesiumPlaneData, position, newPosition))
    }

    if (isAfter(position.time, newest)){
        newest=position.time
    }


    return newest
};

export default updatePlanes;
