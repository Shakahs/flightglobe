import { action, observable } from "mobx";
import {
   LabelDisplayOptions,
   LabelDisplayOptionsUpdate,
   PointDisplayOptions,
   PointDisplayOptionsUpdate,
   TrailDisplayOptions,
   TrailDisplayOptionsUpdate
} from "../types";
import {
   LabelDisplayOptionDefaults,
   PointDisplayOptionDefaults,
   SelectedPointDisplayOptionDefaults,
   TrailDisplayOptionDefaults
} from "../constants";
import { Color } from "cesium";
import { merge } from "lodash-es";

export class DisplayPreferences {
   @observable showNearbyTrails: boolean = true;
   @observable
   pointDisplayOptions: PointDisplayOptions = PointDisplayOptionDefaults;
   @observable
   selectedPointDisplayOptions: PointDisplayOptions = SelectedPointDisplayOptionDefaults;
   @observable
   trailDisplayOptions: TrailDisplayOptions = TrailDisplayOptionDefaults;
   @observable
   labelDisplayOptions: LabelDisplayOptions = LabelDisplayOptionDefaults;

   constructor() {
      this.toggleShowNearbyTrails = this.toggleShowNearbyTrails.bind(this);
      this.updatePointDisplay = this.updatePointDisplay.bind(this);
      this.updateTrailDisplay = this.updateTrailDisplay.bind(this);
      this.updateLabelDisplay = this.updateLabelDisplay.bind(this);
   }

   @action
   toggleShowNearbyTrails() {
      this.showNearbyTrails = !this.showNearbyTrails;
   }

   @action("updatePointDisplay")
   updatePointDisplay(newOptions: PointDisplayOptionsUpdate) {
      if (newOptions.color) {
         newOptions.cesiumColor = Color.fromCssColorString(newOptions.color);
      }
      merge<PointDisplayOptions, PointDisplayOptionsUpdate>(
         this.pointDisplayOptions,
         newOptions
      );
   }

   @action("updateTrailDisplay")
   updateTrailDisplay(newOptions: TrailDisplayOptionsUpdate) {
      if (newOptions.color) {
         newOptions.cesiumColor = Color.fromCssColorString(newOptions.color);
      }
      merge<TrailDisplayOptions, TrailDisplayOptionsUpdate>(
         this.trailDisplayOptions,
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
