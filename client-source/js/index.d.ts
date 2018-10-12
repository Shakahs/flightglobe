import {Icao} from "./types";

export * from './types'
import {Cartesian3, CustomDataSource, Entity, JulianDate} from "cesium";

export declare class Plane {
    constructor(planeData: CustomDataSource, icao: Icao, position: Cartesian3);

    planeData:CustomDataSource;
    entity: Entity;
    icao: Icao;

    public updatePosition(position: Cartesian3, date: JulianDate): void;
    // myMethod(opts: MyClass.MyClassMethodOptions): number;
}

export declare function updatePlanes(planeData: CustomDataSource): any;