import * as Cesium from "cesium";
import {GeoMap} from "./types";

const getOrCreateGeo = function(geohash: string, viewer: Cesium.Viewer, geoMap: GeoMap):Cesium.PointPrimitiveCollection {
    let planeData = geoMap.get(geohash);
    if(!planeData){
        planeData = new Cesium.PointPrimitiveCollection();
        viewer.scene.primitives.add(planeData)
        geoMap.set(geohash, planeData)
    }
    return planeData
};

export default getOrCreateGeo