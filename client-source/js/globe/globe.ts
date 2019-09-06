import * as Cesium from 'cesium';
import {UrlTemplateImageryProvider} from 'cesium';
import {action, observable} from "mobx";
import {GlobeImageryTypes} from "../types";

export class Globe {
    viewer: Cesium.Viewer;
    maxZoom: number = 13;
    @observable selectedImagery: GlobeImageryTypes = GlobeImageryTypes.topographic;

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
            navigationHelpButton: true,
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

    @action
    selectImagery(selection: GlobeImageryTypes){
        let newImagery:UrlTemplateImageryProvider|undefined;
        if(selection===GlobeImageryTypes.satellite && this.selectedImagery !== GlobeImageryTypes.satellite){
            this.selectedImagery = GlobeImageryTypes.satellite;
            newImagery = this.provideMapTilerSatellite()
        }
        if(selection===GlobeImageryTypes.topographic && this.selectedImagery !== GlobeImageryTypes.topographic){
            this.selectedImagery = GlobeImageryTypes.topographic;
            newImagery = this.provideMapTilerTopo()
        }
        if(newImagery){
            this.viewer.imageryLayers.removeAll();
            this.viewer.imageryLayers.addImageryProvider(newImagery)
        }
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
            url: `https://maps.tilehosting.com/styles/hybrid/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`,
            maximumLevel: this.maxZoom
        })
    }
}
