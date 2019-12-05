import {
   LabelDisplayOptions,
   PointDisplayOptions,
   TrackDisplayOptions
} from "./types";
import { Color } from "cesium";

export const PointDisplayOptionDefaults: PointDisplayOptions = {
   color: "#3399ff",
   cesiumColor: Color.fromCssColorString("#3399ff"),
   size: 4,
   outlineColor: "#FFF",
   outlineSize: 1
};
export const SelectedPointDisplayOptionDefaults: PointDisplayOptions = {
   color: "#ff3426",
   cesiumColor: Color.fromCssColorString("#ff3426"),
   size: 4,
   outlineColor: "#FFF",
   outlineSize: 1
};
export const TrackDisplayOptionDefaults: TrackDisplayOptions = {
   color: "#3399ff",
   cesiumColor: Color.fromCssColorString("#3399ff"),
   size: 4,
   showWhenCameraAdjacent: false,
   showWhenSelected: true
};
export const LabelDisplayOptionDefaults: LabelDisplayOptions = {
   color: "#3399ff",
   cesiumColor: Color.fromCssColorString("#3399ff"),
   size: 12,
   showWhenCameraAdjacent: true,
   showWhenSelected: true
};
