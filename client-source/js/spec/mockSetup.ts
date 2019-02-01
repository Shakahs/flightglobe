import * as Cesium from "cesium";
import {FlightStore} from "../flightStore";
import {FlightAPosition1, FlightBPosition1} from "./mockData";
import {FlightObj} from "../flightObj";
import {Globe} from "../globe/globe";


export let viewer: Cesium.Viewer;
export let globe: Globe;
export let flightStore: FlightStore;
export let flightObj: FlightObj;

beforeAll(function() {
    const cesiumDiv = document.createElement('div');
    document.body.appendChild(cesiumDiv);
    globe = new Globe(cesiumDiv);
    viewer = globe.viewer;
});

beforeEach(function() {
    flightStore = new FlightStore(viewer);
    flightStore.addOrUpdateFlight(FlightAPosition1);
    flightStore.addOrUpdateFlight(FlightBPosition1);
    flightObj = flightStore.flights.get(FlightAPosition1.icao) as FlightObj
});

