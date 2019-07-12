import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'cesiumSource/Widgets/widgets.css';
import {interval} from 'rxjs';
import * as React from 'react';
import ReactDOM from 'react-dom';
import {FlightStore} from '../flightStore'
// import applyClickHandler from "../globe/clickHandler";
import App from "./app";
import WebsocketHandler from "../websocketHandler";
import '../styles.scss'
import {Globe} from "../globe/globe";

const globe = new Globe('cesiumContainer');
const flightStore = new FlightStore(globe.viewer);
const wsh = new WebsocketHandler(flightStore.routeUpdate.bind(flightStore));
// applyClickHandler(viewer, flightStore)

const pollInterval = interval(5000);
pollInterval.subscribe(()=>{
  // @ts-ignore: we need to send a request here, not a FlightPosition
  wsh.send({lastReceivedTimestamp: flightStore.newestPositionTimestamp})
});

ReactDOM.render(
    <App
        globe={globe}
        flightStore={flightStore}
    />,
    document.getElementById('reactApp'));
