import { FlightDemographics, FlightPosition, Icao } from "../../lib/types";

export interface Message {
   type: "demographicUpdate" | "positionUpdate";
   body: any;
   icao: Icao;
}

export interface PositionUpdate extends Message {
   body: FlightPosition;
}

export interface DemographicsUpdate extends Message {
   body: FlightDemographics;
}

export interface UpdateRequest {
   lastReceivedTimestamp: number;
}

interface ElementDisplayOptions {
   color: string;
   colorCesium: Cesium.Color;
   size: number;
}

export interface PointDisplayOptions extends ElementDisplayOptions {
   outlineColor: string;
   outlineColorCesium: Cesium.Color;
   outlineSize: number;
}

export type PointDisplayOptionsUpdate = Partial<PointDisplayOptions>;

export interface TrackDisplayOptions extends ElementDisplayOptions {
   showWhenSelected: boolean;
   showWhenCameraAdjacent: boolean;
   maxCameraHeight: number; //meters!
   maxTrackDisplayLength?: number; //minutes
   colorPreset: TrackColorPreset;
}

export type TrackDisplayOptionsUpdate = Partial<TrackDisplayOptions>;

export interface LabelDisplayOptions extends ElementDisplayOptions {
   showWhenSelected: boolean;
   showWhenCameraAdjacent: boolean;
   maxCameraHeight: number; //meters!
}

export type LabelDisplayOptionsUpdate = Partial<LabelDisplayOptions>;

export interface AircraftModelData {
   [model: string]: {
      name: string;
   };
}

export enum GlobeImageryTypes {
   satellite = "satellite",
   topographic = "topographic"
}

export type ColorInterpolator = (t: number) => string;

export interface TrackColorPreset {
   name: string;
   interpolator: ColorInterpolator;
}

export interface TrackColorPresetList {
   [name: string]: TrackColorPreset;
}
