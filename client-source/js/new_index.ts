import { forOwn } from 'lodash-es';
import { Map } from 'immutable';
import { Observable } from 'rxjs';

import 'cesium/Source/Widgets/widgets.css';
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';


let state =  Map()
const mergeData = (state,newData)=>{
    return state.merge(newData);
}

const loc = window.location;
const wsStream = new Observable((observer) => {
    const socket = new WebSocket(`ws://${ loc.host }/sub/globalStream`);
    socket.addEventListener('message', (e) => observer.next(e));
    return () => socket.close();
});

const wsStreamShare = wsStream
    .map((event)=>JSON.parse(event['data']))
    .share();

// const logStream = wsStreamShare.subscribe((data)=>{
//     state = state.merge(data)
// })

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
});

viewer.scene.debugShowFramesPerSecond = true;

const planeData = new CustomDataSource('planedata');
viewer.dataSources.add(planeData);

const scratchC3 = new Cartesian3();
const updatePlanes = wsStreamShare.subscribe((data)=>{
    planeData.entities.suspendEvents();
    forOwn(data,(v,k)=>{
        const entity = planeData.entities.getOrCreateEntity(k)
        entity.point = {
            pixelSize: 2,
        };
        entity.position = Cartesian3.fromDegrees(
            v['lon'],
            v['lat'],
            v['altitude'],
            undefined,
            scratchC3
        );
    })
    planeData.entities.resumeEvents();
})