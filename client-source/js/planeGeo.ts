import * as Cesium from "cesium";
import {GeoMap} from "./types";

const getOrCreateGeo = function(geohash: string, viewer: Cesium.Viewer, geoMap: GeoMap):Cesium.CustomDataSource {
    let planeData = geoMap.get(geohash);
    if(!planeData){
        planeData = new Cesium.CustomDataSource(geohash);
        planeData.entities.suspendEvents();
        viewer.dataSources.add(planeData);
        geoMap.set(geohash, planeData)
    }
    return planeData
};

export default getOrCreateGeo