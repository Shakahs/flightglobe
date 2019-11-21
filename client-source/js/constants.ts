import {
   LabelDisplayOptions,
   PointDisplayOptions,
   TrailDisplayOptions
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
export const TrailDisplayOptionDefaults: TrailDisplayOptions = {
   color: "#3399ff",
   cesiumColor: Color.fromCssColorString("#3399ff"),
   size: 4
};
export const LabelDisplayOptionDefaults: LabelDisplayOptions = {
   color: "#3399ff",
   cesiumColor: Color.fromCssColorString("#3399ff"),
   size: 12
};
