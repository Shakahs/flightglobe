import "core-js/stable";
import "regenerator-runtime/runtime";
import "cesiumSource/Widgets/widgets.css";
import * as React from "react";
import ReactDOM from "react-dom";
// import applyClickHandler from "../globe/clickHandler";
import App from "./app";
import "../styles.scss";
import { Globe } from "../globe/globe";
import { DeepstreamClient } from "@deepstream/client";
import { REMOTE_WINS } from "@deepstream/client/dist/record/merge-strategy";
import { GeoManagerCreator } from "../ds-implementation/GeoManagerCreator";
import { DemographicsManager } from "../ds-implementation/DemographicsManager";
import applyClickHandler from "../globe/clickHandler";
import { Icao } from "../../../lib/types";
import { DisplayPreferences } from "../ds-implementation/DisplayPreferences";

const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
const dsConn = new DeepstreamClient(`${wsProtocol}://localhost:6020`, {
   mergeStrategy: REMOTE_WINS
});

const globe = new Globe("cesiumContainer");
const dm = new DemographicsManager(dsConn, globe);
const dp = new DisplayPreferences();

ReactDOM.render(
   <App globe={globe} demographicsManager={dm} displayPreferences={dp} />,
   document.getElementById("reactApp")
);

applyClickHandler(globe.viewer, (id: Icao) =>
   dm.selectionClickChange.emit("selectionClickChange", id)
);

const getData = async () => {
   //wait until tiles are loaded
   await new Promise((resolve) => {
      const poller = setInterval(() => {
         //@ts-ignore tilesLoaded is missing from TS definition
         if (globe.viewer.scene.globe.tilesLoaded) {
            clearInterval(poller);
            resolve();
         }
      }, 1000);
   });

   dm.subscribe();
   const gmc = new GeoManagerCreator(dsConn, dm, dp, globe);
   gmc.subscribe();
};

dsConn.login().then(getData);
