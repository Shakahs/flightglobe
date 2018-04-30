import { forOwn, has } from 'lodash-es';
import { Map } from 'immutable';
import { Observable } from 'rxjs';

import DateTime from 'luxon/src/datetime';

import 'cesium/Source/Widgets/widgets.css';
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';
import JulianDate from 'cesium/Source/Core/JulianDate';
import Clock from 'cesium/Source/Core/Clock';

import { globe } from './api';
import Plane from './plane';

// const state = Map();
// const mergeData = (state, newData) => {
//   return state.merge(newData);
// };

const loc = window.location;
const populate$ = Observable.fromPromise(globe.retrieveGlobalSnapshot());
const wsStream$ = new Observable((observer) => {
  const socket = new WebSocket(`ws://${ loc.host }/sub/globalStream`);
  socket.addEventListener('message', (e) => observer.next(e));
  return () => socket.close();
});

const wsStreamShare$ = wsStream$
  .map((event) => JSON.parse(event.data))
  .share();
const dataStream = wsStreamShare$
  .merge(populate$);

const viewer = new Viewer('cesiumContainer', {
  animation: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  sceneModePicker: false,
  selectionIndicator: true,
  timeline: false,
  navigationHelpButton: false,
  scene3DOnly: true,
  // imageryProvider,
  // terrainProvider,
  requestRenderMode: false,
  shouldAnimate: true,
  // automaticallyTrackDataSourceClocks: false,
});

const planeData = new CustomDataSource('planedata');
// const dsClock = new Clock({
//   currentTime: JulianDate.fromIso8601(DateTime.utc().minus({ seconds: 90 }).toISO()),
// });
// planeData.clock = dsClock;

viewer.scene.debugShowFramesPerSecond = true;
// viewer.clock.currentTime = dsClock.currentTime.clone();
viewer.dataSources.add(planeData);

const scratchC3 = new Cartesian3();
// const scratchJulian = JulianDate.now();
const knownPlanes = {};
const updatePlanes = dataStream.subscribe((data) => {
  const now = JulianDate.now();
  const future = JulianDate.addSeconds(now, 30, JulianDate.now());
  planeData.entities.suspendEvents();
  forOwn(data, (v, k) => {
    // const diff = DateTime
    //   .utc()
    //   .diff(DateTime.fromMillis(v.time * 1000, { zone: 'utc' }), 'seconds')
    //   .toObject();
    // console.log(`position age is ${ diff.seconds } seconds`);

    const newPosition = Cartesian3.fromDegrees(
      v.lon,
      v.lat,
      v.altitude,
      undefined,
      scratchC3
    );
    // const newDate = JulianDate.fromIso8601(
    //   DateTime.fromMillis(v.time * 1000, { zone: 'utc' }).toISO(),
    //   scratchJulian
    // );

    if (!has(knownPlanes, k)) {
      knownPlanes[k] = new Plane(planeData, k, newPosition, now);
    } else {
      knownPlanes[k].updatePosition(newPosition, future);
    }
  });
  planeData.entities.resumeEvents();
});
