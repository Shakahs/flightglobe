import { globe } from "./mockSetup";
import { UrlTemplateImageryProvider, Viewer } from "cesium";
import { GlobeImageryTypes } from "../types";

describe("the Globe class", () => {
   it("creates a globe", () => {
      expect(globe.viewer).not.toBeNull();
      expect(globe.viewer).toEqual(jasmine.any(Viewer));
   });

   describe("imagery layers", () => {
      it("creates a globe with the default Topo imagery layer", () => {
         const activeLayer = globe.viewer.imageryLayers.get(0);
         const provider = activeLayer.imageryProvider as UrlTemplateImageryProvider;
         expect(
            provider.url.indexOf(
               "https://maps.tilehosting.com/styles/topo/{z}/{x}/{y}.png?"
            )
         ).toEqual(0);
         expect(globe.selectedImagery).toEqual(GlobeImageryTypes.topographic);
      });

      it("switches to the topo imagery when asked", () => {
         globe.selectImagery(GlobeImageryTypes.satellite);
         globe.selectImagery(GlobeImageryTypes.topographic);
         const activeProvider = globe.viewer.imageryLayers.get(0)
            .imageryProvider as UrlTemplateImageryProvider;
         expect(
            activeProvider.url.indexOf(
               "https://maps.tilehosting.com/styles/topo/{z}/{x}/{y}.png?"
            )
         ).toEqual(0);
         expect(globe.selectedImagery).toEqual(GlobeImageryTypes.topographic);
      });

      it("switches to the satellite imagery when asked", () => {
         globe.selectImagery(GlobeImageryTypes.satellite);
         const activeProvider = globe.viewer.imageryLayers.get(0)
            .imageryProvider as UrlTemplateImageryProvider;
         expect(
            activeProvider.url.indexOf(
               "https://maps.tilehosting.com/styles/hybrid/{z}/{x}/{y}.jpg?"
            )
         ).toEqual(0);
         expect(globe.selectedImagery).toEqual(GlobeImageryTypes.satellite);
      });
   });
});
