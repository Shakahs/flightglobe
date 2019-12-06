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

export const createGlobe = (): Globe => {
   const cesiumDiv = document.createElement("div");
   document.body.appendChild(cesiumDiv);
   const globe = new Globe(cesiumDiv);
   return globe;
};

export const destroyGlobe = (globe: Globe) => {
   globe.viewer.destroy();
};
