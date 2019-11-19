import { DeepstreamClient } from "@deepstream/client";
import { Globe } from "../../globe/globe";
import { Viewer } from "cesium";
const {
   REMOTE_WINS
} = require("@deepstream/client/dist/record/merge-strategy");

export const provideConnection = async () => {
   const newConn = new DeepstreamClient("localhost:6020", {
      mergeStrategy: REMOTE_WINS
   });
   await newConn.login();
   return newConn;
};

export const sleep = (n: number) =>
   new Promise((resolve) => setTimeout(resolve, n));

export const createViewer = (): Viewer => {
   const cesiumDiv = document.createElement("div");
   document.body.appendChild(cesiumDiv);
   const globe = new Globe(cesiumDiv);
   const viewer = globe.viewer;
   return viewer;
};

export const destroyViewer = (viewer: Viewer) => {
   if (!viewer.isDestroyed()) {
      viewer.destroy();
   }
};
