import * as Cesium from 'cesium';
import {DemographicsUpdate, FlightMap, GeoMap, PositionUpdate} from '../../js/types';
import getOrCreateGeo from "./geoArea";
import {createPoint, getOrCreateFlight} from "./utility";
import {IComputedValue} from "mobx";

// import Cartesian3  from 'cesium/Source/Core/Cartesian3'
// const JulianDate = require('cesium/Source/Core/JulianDate')
// const CustomDataSource = require('cesium/Source/DataSources/CustomDataSource')

// import { Cartesian3, CustomDataSource} from 'cesium';
// import {JulianDate} from 'cesium';

const scratchC3 = new Cesium.Cartesian3();
// const scratchJulian = JulianDate.now();

// export const updateFlight = (flightData: FlightMap, geoData:GeoMap, viewer:Cesium.Viewer,
//                              positionUpdate: PositionUpdate, affectedGeos, newestPositionTimestamp: number):number => {
//
//     const thisFlight = getOrCreateFlight(flightData, positionUpdate.icao);
//
//     const newPosition = Cesium.Cartesian3.fromDegrees(
//       positionUpdate.body.longitude,
//       positionUpdate.body.latitude,
//       positionUpdate.body.altitude,
//       undefined,
//       scratchC3
//     );
//
//     // if (thisFlight.point) {
//     //     thisFlight.point.position = newPosition;
//     // } else {
//     //     thisFlight.point = createEntity(positionUpdate, newPosition)
//     // }1
//
//     if (!thisFlight.geohash){
//         //new flight
//         thisFlight.geohash = positionUpdate.geohash;
//         const newGeo = getOrCreateGeo(thisFlight.geohash, viewer, geoData);
//         thisFlight.point = newGeo.add(createPoint(newPosition));
//         affectedGeos.add(thisFlight.geohash)
//     } else if (thisFlight.geohash !== positionUpdate.geohash){
//         //existing flight moved to a different geohash
//         const newGeo = getOrCreateGeo(positionUpdate.geohash, viewer, geoData);
//         const oldGeo = getOrCreateGeo(thisFlight.geohash, viewer, geoData);
//         if(thisFlight.point){oldGeo.remove(thisFlight.point);}
//         thisFlight.point = newGeo.add(createPoint(newPosition));
//         affectedGeos.add(thisFlight.geohash);
//         affectedGeos.add(positionUpdate.geohash);
//         thisFlight.geohash = positionUpdate.geohash
//     }
//
//     //apply demographics data if we have it
//     // if(!thisFlight.entity.label && thisFlight.demographics){
//     //     thisFlight.entity.label = createLabel(thisFlight)
//     // }
//
//     //do this so the calling function in app.ts can figure out what is the last timestamp received,
//     // which is used for the poll sent to the server for new data
//     return (positionUpdate.body.timestamp > newestPositionTimestamp) ?
//         positionUpdate.body.timestamp : newestPositionTimestamp;
//
// };

export const updateDemographics = (flightData: FlightMap, demographicsUpdate: DemographicsUpdate) => {
    const thisFlight = getOrCreateFlight(flightData, demographicsUpdate.icao);
    thisFlight.demographics = demographicsUpdate.body;
    // if(thisFlight.entity && !thisFlight.entity.label){
    //     thisFlight.entity.label = createLabel(thisFlight)
    // }
};
