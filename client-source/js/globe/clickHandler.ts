import {
   GeometryInstance,
   PointPrimitive,
   ScreenSpaceEventHandler,
   ScreenSpaceEventType,
   Viewer
} from "cesium";
import { Icao } from "../types";

const applyClickHandler = function(
   viewer: Viewer,
   callback: (icao: Icao) => void
) {
   const handler = new ScreenSpaceEventHandler(viewer.canvas);
   handler.setInputAction(async (click) => {
      // picked object will be a displayed flight or its trail
      const pickedObject:
         | PointPrimitive
         | GeometryInstance
         | undefined = viewer.scene.pick(click.position);
      if (pickedObject) {
         console.log(`picked object id: ${pickedObject.id}`);
         callback(pickedObject.id);
      }
   }, ScreenSpaceEventType.LEFT_CLICK);
};

export default applyClickHandler;
