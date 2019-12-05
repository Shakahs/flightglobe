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
   cesiumColor: Cesium.Color;
   size: number;
}

export interface PointDisplayOptions extends ElementDisplayOptions {
   outlineColor: string;
   outlineSize: number;
}

export type PointDisplayOptionsUpdate = Partial<PointDisplayOptions>;

export interface TrackDisplayOptions extends ElementDisplayOptions {
   showWhenSelected: boolean;
   showWhenCameraAdjacent: boolean;
}

export type TrackDisplayOptionsUpdate = Partial<TrackDisplayOptions>;

export interface LabelDisplayOptions extends ElementDisplayOptions {
   showWhenSelected: boolean;
   showWhenCameraAdjacent: boolean;
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
