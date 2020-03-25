import {
   LabelDisplayOptions,
   PointDisplayOptions,
   TrackDisplayOptions
} from "./types";
import { Color } from "cesium";

export const PointDisplayOptionDefaults: PointDisplayOptions = {
   color: "#3399ff",
   colorCesium: Color.fromCssColorString("#3399ff"),
   size: 4,
   outlineColor: "#FFF",
   outlineColorCesium: Color.fromCssColorString("#FFF"),
   outlineSize: 1
};
export const SelectedPointDisplayOptionDefaults: PointDisplayOptions = {
   color: "#ff3426",
   colorCesium: Color.fromCssColorString("#ff3426"),
   size: 4,
   outlineColor: "#FFF",
   outlineColorCesium: Color.fromCssColorString("#FFF"),
   outlineSize: 1
};
export const TrackDisplayOptionDefaults: TrackDisplayOptions = {
   color: "#3399ff",
   colorCesium: Color.fromCssColorString("#3399ff"),
   size: 4,
   showWhenCameraAdjacent: false,
   showWhenSelected: true,
   maxCameraHeight: 500000,
   maxTrackDisplayLength: 3
};
export const LabelDisplayOptionDefaults: LabelDisplayOptions = {
   color: "#3399ff",
   colorCesium: Color.fromCssColorString("#3399ff"),
   size: 12,
   showWhenCameraAdjacent: true,
   showWhenSelected: true,
   maxCameraHeight: 500000
};
