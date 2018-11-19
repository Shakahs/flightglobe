import { forEach, has } from 'lodash-es';

import * as Cesium from 'cesium';

// import Cartesian3  from 'cesium/Source/Core/Cartesian3'
// const JulianDate = require('cesium/Source/Core/JulianDate')
// const CustomDataSource = require('cesium/Source/DataSources/CustomDataSource')

// import { Cartesian3, CustomDataSource} from 'cesium';
// import {JulianDate} from 'cesium';

import {createEntity} from './flight';
import {
    FlightPosition,
    FlightPositionMap,
    Flight,
    FlightMap,
    FlightDemographics,
    DemographicsUpdate,
    Icao, PositionUpdate, GeoMap
} from "./types";
import getOrCreateGeo from "./planeGeo";
const isAfter = require('date-fns/is_after')

const scratchC3 = new Cesium.Cartesian3()
// const scratchJulian = JulianDate.now();

const getOrCreateFlight = (flightData: FlightMap, icao: Icao):Flight=>{
    let thisFlight = flightData.get(icao);
    if(!thisFlight){
        thisFlight = {icao, entity: undefined, demographics: undefined, geohash: undefined};
        flightData.set(icao, thisFlight)
    }
    return thisFlight
};

let newest = 0;
const labelDisplayCondition = new Cesium.DistanceDisplayCondition(0.0, 2000000);
const labelOffset = new Cesium.Cartesian2(10,20);

const createLabel = (thisFlight: Flight):Cesium.LabelGraphics=>{
    return new Cesium.LabelGraphics(
        //@ts-ignore
        {text: `${thisFlight.icao}\n${thisFlight.demographics.origin}\n${thisFlight.demographics.destination}`, font: '12px sans-serif',
            //@ts-ignore
            distanceDisplayCondition: labelDisplayCondition, pixelOffset: labelOffset})
};

export const updateFlight = (flightData: FlightMap, geoData:GeoMap, viewer:Cesium.Viewer,
                             positionUpdate: PositionUpdate):number => {


    const thisFlight = getOrCreateFlight(flightData, positionUpdate.icao);

    const newPosition = Cesium.Cartesian3.fromDegrees(
      positionUpdate.body.longitude,
      positionUpdate.body.latitude,
      positionUpdate.body.altitude,
      undefined,
      scratchC3
    );

    if (thisFlight.entity) {
        thisFlight.entity.position = newPosition;
    } else {
        thisFlight.entity = createEntity(positionUpdate, newPosition)
    }

    if (!thisFlight.geohash){
        //new flight
        thisFlight.geohash = positionUpdate.geohash;
        const newGeo = getOrCreateGeo(thisFlight.geohash, viewer, geoData);
        newGeo.entities.add(thisFlight.entity)
    } else if (thisFlight.geohash !== positionUpdate.geohash){
        //existing flight moved to a different geohash
        const newGeo = getOrCreateGeo(positionUpdate.geohash, viewer, geoData);
        const oldGeo = getOrCreateGeo(thisFlight.geohash, viewer, geoData);
        oldGeo.entities.remove(thisFlight.entity);
        newGeo.entities.add(thisFlight.entity);
        thisFlight.geohash = positionUpdate.geohash
    }

    //apply demographics data if we have it
    // if(!thisFlight.entity.label && thisFlight.demographics){
    //     thisFlight.entity.label = createLabel(thisFlight)
    // }
    if(positionUpdate.body.timestamp > newest){
        newest = positionUpdate.body.timestamp
    }
    return newest
};

export const updateDemographics = (flightData: FlightMap, demographicsUpdate: DemographicsUpdate) => {
    const thisFlight = getOrCreateFlight(flightData, demographicsUpdate.icao);
    thisFlight.demographics = demographicsUpdate.body;
    // if(thisFlight.entity && !thisFlight.entity.label){
    //     thisFlight.entity.label = createLabel(thisFlight)
    // }
};
