import { forOwn, has } from 'lodash-es';

import {Cartesian3, CustomDataSource} from 'cesium';
import {JulianDate} from 'cesium';

import Plane from './plane';
import {FlightPositionMap, PlaneMap} from "./types";

const scratchC3 = new Cartesian3();
// const scratchJulian = JulianDate.now();
const knownPlanes:PlaneMap = {};


const updatePlanes = (planeData: CustomDataSource, data: FlightPositionMap):void => {
  const now = JulianDate.now();
  const future = JulianDate.addSeconds(now, 30, JulianDate.now());

  forOwn(data, (v, k) => {
    // const diff = DateTime
    //   .utc()
    //   .diff(DateTime.fromMillis(v.time * 1000, { zone: 'utc' }), 'seconds')
    //   .toObject();
    // console.log(`position age is ${ diff.seconds } seconds`);

    const newPosition = Cartesian3.fromDegrees(
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

    if (!has(knownPlanes, k)) {
      knownPlanes[k] = new Plane(planeData, k, newPosition);
    } else {
      knownPlanes[k].updatePosition(newPosition, future);
    }
  });
};

export default updatePlanes;
