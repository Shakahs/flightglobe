import axios from "axios";
import { FlightStore } from "../flightStore";
import {
   PointPrimitive,
   Polyline,
   ScreenSpaceEventHandler,
   ScreenSpaceEventType,
   Viewer
} from "cesium";
import { FlightRecord } from "../../../lib/types";

const applyClickHandler = function(viewer: Viewer, flightStore: FlightStore) {
   const handler = new ScreenSpaceEventHandler(viewer.canvas);
   // @ts-ignore: the installed Cesium type definition is incorrect (@types/cesium 1.47.3),
   // setInputAction will pass an argument (click in this case)
   handler.setInputAction(async (click) => {
      const pickedObject: PointPrimitive | Polyline = viewer.scene.pick(
         click.position
      );
      if (pickedObject) {
         console.log(`picked object id: ${pickedObject.id}`);
         const trackURL = `/track?icao=${pickedObject.id}`;
         console.log(trackURL);
         try {
            const { data } = await axios.get<FlightRecord[]>(trackURL);
            // flightStore.importTrack(data)
            flightStore.updateSelectedFlight(
               new Map<string, boolean>([[pickedObject.id, true]])
            );
         } catch (e) {
            console.log("track retrieval failed with error", e);
         }
      }
   }, ScreenSpaceEventType.LEFT_CLICK);
};

export default applyClickHandler;
