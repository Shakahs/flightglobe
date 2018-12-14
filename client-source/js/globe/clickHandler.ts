import * as Cesium from "cesium";
import axios from "axios";
import {FlightStore} from "../store";
import {FlightRecord} from "../types";

const applyClickHandler = function(viewer: Cesium.Viewer, flightStore: FlightStore){
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
    // @ts-ignore: the installed Cesium type definition is incorrect (@types/cesium 1.47.3),
    // setInputAction will pass an argument (click in this case)
    handler.setInputAction(async (click) => {
        const pickedObject:Cesium.PointPrimitive | Cesium.Polyline = viewer.scene.pick(click.position);
        if (pickedObject) {
            console.log(`picked object id: ${pickedObject.id}`);
            const trackURL = `/track?icao=${ pickedObject.id }`;
            console.log(trackURL);
            try {
                const {data} = await axios.get<FlightRecord[]>(trackURL);
                flightStore.importTrack(data)
                flightStore.selectedFlight = pickedObject.id;
            } catch (e) {
                console.log('track retrieval failed with error', e)
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

export default  applyClickHandler