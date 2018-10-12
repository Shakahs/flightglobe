import { forOwn } from 'lodash-es';

import {Cartesian3} from 'cesium';
import {LabelStyle} from 'cesium';
import {DistanceDisplayCondition} from 'cesium';

const ddCondition = new DistanceDisplayCondition(0.0, 100000);
const scratchC3 = new Cartesian3();

const loadAirports = (airportData, airportDataRaw) => {
  airportData.entities.suspendEvents();
  forOwn(airportDataRaw, (v) => {
    const newPosition = Cartesian3.fromDegrees(
      v.lng,
      v.lat,
      v.altitude,
      undefined,
      scratchC3
    );

    airportData.entities.add({
      // point: {
      //   pixelSize: 2,
      //   color: Color.red,
      // },
      label: {
        text: v.name,
        font: '14px sans-serif',
        distanceDisplayCondition: ddCondition,
        style: LabelStyle.FILL_AND_OUTLINE,
      },
      position: newPosition,
      id: v.icao,
    });
  });
  airportData.entities.resumeEvents();
};

export default loadAirports;
