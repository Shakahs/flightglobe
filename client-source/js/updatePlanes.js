import { forOwn, has } from 'lodash-es';

import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import JulianDate from 'cesium/Source/Core/JulianDate';

import Plane from './plane';

const scratchC3 = new Cartesian3();
// const scratchJulian = JulianDate.now();
const knownPlanes = {};


const updatePlanes = (planeData, data) => {
  const now = JulianDate.now();
  const future = JulianDate.addSeconds(now, 30, JulianDate.now());

  forOwn(data, (v, k) => {
    // const diff = DateTime
    //   .utc()
    //   .diff(DateTime.fromMillis(v.time * 1000, { zone: 'utc' }), 'seconds')
    //   .toObject();
    // console.log(`position age is ${ diff.seconds } seconds`);

    const newPosition = Cartesian3.fromDegrees(
      v.lon,
      v.lat,
      v.altitude,
      undefined,
      scratchC3
    );
    // const newDate = JulianDate.fromIso8601(
    //   DateTime.fromMillis(v.time * 1000, { zone: 'utc' }).toISO(),
    //   scratchJulian
    // );

    if (!has(knownPlanes, k)) {
      knownPlanes[k] = new Plane(planeData, k, newPosition, now);
    } else {
      knownPlanes[k].updatePosition(newPosition, future);
    }
  });
};

export default updatePlanes;
