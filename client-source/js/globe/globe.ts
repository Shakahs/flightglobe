import * as Cesium from 'cesium';
import axios from 'axios';
import {viewer} from './initializeGlobe'

// import {Viewer} from 'cesium';
// import {CustomDataSource} from 'cesium';

//percentage of change to trigger camera changed event. lowered to make camera events more responsive
viewer.camera.percentageChanged = 0.3;

export { viewer };
