import * as Cesium from "cesium";
import {UrlTemplateImageryProvider} from "cesium";


export const provideMapTilerTopo = ():UrlTemplateImageryProvider =>{
    return new Cesium.UrlTemplateImageryProvider({
        //@ts-ignore
        url : `https://maps.tilehosting.com/styles/topo/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
        maximumLevel : 13
    })
};