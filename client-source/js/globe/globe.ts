import * as Cesium from 'cesium';
import axios from 'axios';
import {UrlTemplateImageryProvider} from "cesium";
import {ImageryProvider} from "cesium";

export class Globe {
    viewer: Cesium.Viewer;
    maxZoom: number = 13;

    constructor(container: Element | string){
        this.viewer = new Cesium.Viewer(container, {
            animation: false,
            baseLayerPicker: false,
            fullscreenButton: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            selectionIndicator: true,
            timeline: false,
            navigationHelpButton: false,
            scene3DOnly: true,
            requestRenderMode: true,
            maximumRenderTimeChange : Infinity,
            // imageryProvider : new Cesium.BingMapsImageryProvider({
            //     url: 'http://dev.virtualearth.net',
            //     key: 'Annkf_qhmEYkCSYC9PrxYrFwP1ZJOH1wm1x_g5GeuoXkWII7RU94Npx8VJUFwDMZ',
            //     mapStyle: 'AerialWithLabels'
            // }),

            //@ts-ignore MapboxImageryProvider not in typings
            // imageryProvider : new Cesium.MapboxImageryProvider({
            //     accessToken: 'pk.eyJ1Ijoic2hha2FocyIsImEiOiJjamNsbzd5djYwZWJlMnhtcmVtZXVlMTRmIn0.NmQSM1rRe71p3r2-fbf1ww',
            //     mapId: 'mapbox.satellite'
            // }),

            imageryProvider: this.provideMapTilerTopo()
        });

        //percentage of change to trigger camera changed event. lowered to make camera events more responsive
        this.viewer.camera.percentageChanged = 0.3;
    }

    updateImagery(newImagery: ImageryProvider){
        const layers = this.viewer.imageryLayers;
        const currentLayer = layers.get(0);
        layers.remove(currentLayer);
        layers.addImageryProvider(newImagery)
    }

    provideMapTilerTopo():UrlTemplateImageryProvider {
        return new Cesium.UrlTemplateImageryProvider({
            //@ts-ignore
            url: `https://maps.tilehosting.com/styles/topo/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
            maximumLevel: this.maxZoom
        })
    }

    provideMapTilerSatellite():UrlTemplateImageryProvider {
        return new Cesium.UrlTemplateImageryProvider({
            //@ts-ignore
            url: `https://maps.tilehosting.com/styles/hybrid/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
            maximumLevel: this.maxZoom
        })
    }
}
