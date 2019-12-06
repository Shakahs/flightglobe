import {
   Cartesian3,
   Cartographic,
   UrlTemplateImageryProvider,
   Viewer
} from "cesium";
import { action, observable } from "mobx";
import { GlobeImageryTypes } from "../types";
import { debounce } from "lodash-es";

export class Globe {
   viewer: Viewer;
   maxZoom: number = 13;
   @observable selectedImagery: GlobeImageryTypes =
      GlobeImageryTypes.topographic;
   @observable.ref cameraPosition: Cartographic;

   constructor(container: Element | string) {
      this.viewer = new Viewer(container, {
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
         maximumRenderTimeChange: Infinity,
         // imageryProvider : new BingMapsImageryProvider({
         //     url: 'http://dev.virtualearth.net',
         //     key: 'Annkf_qhmEYkCSYC9PrxYrFwP1ZJOH1wm1x_g5GeuoXkWII7RU94Npx8VJUFwDMZ',
         //     mapStyle: 'AerialWithLabels'
         // }),

         //@ts-ignore MapboxImageryProvider not in typings
         // imageryProvider : new MapboxImageryProvider({
         //     accessToken: 'pk.eyJ1Ijoic2hha2FocyIsImEiOiJjamNsbzd5djYwZWJlMnhtcmVtZXVlMTRmIn0.NmQSM1rRe71p3r2-fbf1ww',
         //     mapId: 'mapbox.satellite'
         // }),

         imageryProvider: this.provideMapTilerTopo()
      });

      //percentage of change to trigger camera changed event. lowered to make camera events more responsive
      this.viewer.camera.percentageChanged = 0.3;

      this.cameraPosition = this.calculateCameraPosition();
      const debouncedCameraUpdate = debounce(
         this.updateCameraPosition.bind(this),
         500
      );

      this.viewer.camera.changed.addEventListener(debouncedCameraUpdate);
   }

   @action
   updateCameraPosition() {
      this.cameraPosition = this.calculateCameraPosition();
   }

   calculateCameraPosition(): Cartographic {
      return this.viewer.scene.globe.ellipsoid.cartesianToCartographic(
         this.viewer.camera.position
      );
   }

   @action
   selectImagery(selection: GlobeImageryTypes) {
      let newImagery: UrlTemplateImageryProvider | undefined;
      if (
         selection === GlobeImageryTypes.satellite &&
         this.selectedImagery !== GlobeImageryTypes.satellite
      ) {
         this.selectedImagery = GlobeImageryTypes.satellite;
         newImagery = this.provideMapTilerSatellite();
      }
      if (
         selection === GlobeImageryTypes.topographic &&
         this.selectedImagery !== GlobeImageryTypes.topographic
      ) {
         this.selectedImagery = GlobeImageryTypes.topographic;
         newImagery = this.provideMapTilerTopo();
      }
      if (newImagery) {
         this.viewer.imageryLayers.removeAll();
         this.viewer.imageryLayers.addImageryProvider(newImagery);
      }
   }

   provideMapTilerTopo(): UrlTemplateImageryProvider {
      return new UrlTemplateImageryProvider({
         //@ts-ignore
         url: `https://maps.tilehosting.com/styles/topo/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
         maximumLevel: this.maxZoom
      });
   }

   provideMapTilerSatellite(): UrlTemplateImageryProvider {
      return new UrlTemplateImageryProvider({
         //@ts-ignore
         url: `https://maps.tilehosting.com/styles/hybrid/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`,
         maximumLevel: this.maxZoom
      });
   }
}
