import { action, observable } from "mobx";
import {
   LabelDisplayOptions,
   LabelDisplayOptionsUpdate,
   PointDisplayOptions,
   PointDisplayOptionsUpdate,
   TrackDisplayOptions,
   TrackDisplayOptionsUpdate
} from "../types";
import {
   LabelDisplayOptionDefaults,
   PointDisplayOptionDefaults,
   SelectedPointDisplayOptionDefaults,
   TrackDisplayOptionDefaults
} from "../constants";
import { Color } from "cesium";
import { assign, merge } from "lodash";

export class DisplayPreferences {
   @observable.ref
   pointDisplayOptions: PointDisplayOptions = PointDisplayOptionDefaults;

   @observable
   selectedPointDisplayOptions: PointDisplayOptions = SelectedPointDisplayOptionDefaults;

   @observable
   trackDisplayOptions: TrackDisplayOptions = TrackDisplayOptionDefaults;

   @observable
   labelDisplayOptions: LabelDisplayOptions = LabelDisplayOptionDefaults;

   constructor() {
      this.updatePointDisplay = this.updatePointDisplay.bind(this);
      this.updateTrackDisplay = this.updateTrackDisplay.bind(this);
      this.updateLabelDisplay = this.updateLabelDisplay.bind(this);
   }

   @action("updatePointDisplay")
   updatePointDisplay(newOptions: PointDisplayOptionsUpdate) {
      if (newOptions.color) {
         newOptions.cesiumColor = Color.fromCssColorString(newOptions.color);
      }
      this.pointDisplayOptions = assign<
         unknown,
         PointDisplayOptions,
         PointDisplayOptionsUpdate
      >({}, this.pointDisplayOptions, newOptions);
   }

   @action("updateTrackDisplay")
   updateTrackDisplay(newOptions: TrackDisplayOptionsUpdate) {
      if (newOptions.color) {
         newOptions.cesiumColor = Color.fromCssColorString(newOptions.color);
      }
      merge<TrackDisplayOptions, TrackDisplayOptionsUpdate>(
         this.trackDisplayOptions,
         newOptions
      );
   }

   @action("updateLabelDisplay")
   updateLabelDisplay(newOptions: LabelDisplayOptionsUpdate) {
      if (newOptions.color) {
         newOptions.cesiumColor = Color.fromCssColorString(newOptions.color);
      }
      merge<LabelDisplayOptions, LabelDisplayOptionsUpdate>(
         this.labelDisplayOptions,
         newOptions
      );
   }
}
