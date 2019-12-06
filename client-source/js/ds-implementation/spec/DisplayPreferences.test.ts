import {
   LabelDisplayOptionDefaults,
   PointDisplayOptionDefaults,
   TrackDisplayOptionDefaults
} from "../../constants";
import {
   LabelDisplayOptions,
   LabelDisplayOptionsUpdate,
   PointDisplayOptions,
   PointDisplayOptionsUpdate,
   TrackDisplayOptions,
   TrackDisplayOptionsUpdate
} from "../../types";
import { cloneDeep, merge } from "lodash-es";
import { Color } from "cesium";
import { DisplayPreferences } from "../DisplayPreferences";

describe("DisplayPreferences", function() {
   let dp: DisplayPreferences;

   beforeEach(() => {
      dp = new DisplayPreferences();
   });

   describe("for points", function() {
      it("should update the point display colors", function() {
         expect(dp.pointDisplayOptions).toEqual(PointDisplayOptionDefaults);
         const newOptions: PointDisplayOptionsUpdate = {
            color: "#ff6699"
         };
         dp.updatePointDisplay(newOptions);
         const finalResult = cloneDeep(PointDisplayOptionDefaults);
         merge<PointDisplayOptions, PointDisplayOptionsUpdate>(
            finalResult,
            newOptions
         );
         expect(dp.pointDisplayOptions).toEqual(finalResult);
         expect(
            dp.pointDisplayOptions.colorCesium.equals(
               Color.fromCssColorString(newOptions.color as string)
            )
         ).toBeTruthy();
      });
   });

   describe("for tracks", function() {
      it("should update the track display options", function() {
         expect(dp.trackDisplayOptions).toEqual(TrackDisplayOptionDefaults);
         const newOptions = {
            color: "#ff6699"
         };
         dp.updateTrackDisplay(newOptions);
         const finalResult = cloneDeep(TrackDisplayOptionDefaults);
         merge<TrackDisplayOptions, TrackDisplayOptionsUpdate>(
            finalResult,
            newOptions
         );
         expect(dp.trackDisplayOptions).toEqual(finalResult);
         expect(
            dp.trackDisplayOptions.colorCesium.equals(
               Color.fromCssColorString(newOptions.color)
            )
         ).toBeTruthy();
      });
   });

   describe("for labels", function() {
      it("should update the label display options", function() {
         expect(dp.labelDisplayOptions).toEqual(LabelDisplayOptionDefaults);
         const newOptions = {
            color: "#ff6699"
         };
         dp.updateLabelDisplay(newOptions);
         const finalResult = cloneDeep(LabelDisplayOptionDefaults);
         merge<LabelDisplayOptions, LabelDisplayOptionsUpdate>(
            finalResult,
            newOptions
         );
         expect(dp.labelDisplayOptions).toEqual(finalResult);
         expect(
            dp.labelDisplayOptions.colorCesium.equals(
               Color.fromCssColorString(newOptions.color)
            )
         ).toBeTruthy();
      });
      it("should update display options", () => {
         dp.updateLabelDisplay({ showWhenCameraAdjacent: false });
         expect(dp.labelDisplayOptions.showWhenCameraAdjacent).toBeFalsy();
         dp.updateLabelDisplay({ showWhenCameraAdjacent: true });
         expect(dp.labelDisplayOptions.showWhenCameraAdjacent).toBeTruthy();
      });
   });
});
