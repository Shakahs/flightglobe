import React, { Component } from 'react';

import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import BingMapsImageryProvider from 'cesium/Source/Scene/BingMapsImageryProvider';
import CesiumTerrainProvider from 'cesium/Source/Core/CesiumTerrainProvider';
import Cartesian2 from 'cesium/Source/Core/Cartesian2';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import Ellipsoid from 'cesium/Source/Core/Ellipsoid';
import CesiumMath from 'cesium/Source/Core/Math';

const BING_MAPS_URL = '//dev.virtualearth.net';
const BING_MAPS_KEY = 'ApDPY15x9lCXO5Hw89M1G5Q84_BlKalPbjor8GvKGj2UAnVtzlT5UT-zrylU1e48';
const STK_TERRAIN_URL = '//assets.agi.com/stk-terrain/world';

import CesiumProjectContents from './CesiumProjectContents';
import CesiumClickHandler from './CesiumClickHandler';
import CesiumCameraManager from './CesiumCameraManager';

export default class CesiumGlobe extends Component {
  constructor(props) {
    super(props);
    this.state = { viewerLoaded: false };
  }

  componentDidMount() {
    const imageryProvider = new BingMapsImageryProvider({
      url: BING_MAPS_URL,
      key: BING_MAPS_KEY,
    });

    const terrainProvider = new CesiumTerrainProvider({
      url: STK_TERRAIN_URL,
    });

    this.viewer = new Viewer(this.cesiumContainer, {
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
      imageryProvider,
      terrainProvider,
      requestRenderMode: true,
    });

    // Force immediate re-render now that the Cesium viewer is created
    this.setState({ viewerLoaded: true }); // eslint-disable-line react/no-did-mount-set-state

    this.viewer.camera.changed.addEventListener(() => {
      console.log('camera moved');
      this.detectViewableArea();
    });
  }

  componentWillUnmount() {
    if (this.viewer) {
      this.viewer.destroy();
    }
  }

  detectViewableArea() {
    const viewer = this.viewer;
    const CC3 = Cartesian3;
    const camera = viewer.scene.camera;
    const cam = camera;
    const ellipsoid = viewer.scene.globe.ellipsoid;
    const rad = 6371000; // Earth average radius


    function addVectors(vectors) {
      const resultant = new Cartesian3(0, 0, 0);
      let i = 0; while (i < vectors.length) {
        resultant.x += vectors[i].x;
        resultant.y += vectors[i].y;
        resultant.z += vectors[i].z;
        i += 1;
      }
      return resultant;
    }

    function scaleVector(scale, vector) {
      const temp = new Cartesian3();
      temp.x = scale * vector.x; temp.y = scale * vector.y; temp.z = scale * vector.z;
      return temp;
    }

    function rotate(rotatee, rotater, angle) {
      // rotater: unit vector, angle:radians
      // CCW looking from vector tip to vector base
      const rotated = new CC3();
      const c = Math.cos(angle); const s = Math.sin(angle);
      const dotScale = CC3.dot(rotatee, rotater, new CC3());
      const rotaterScaled = scaleVector(dotScale, rotater);
      const vPerpAxis = CC3.subtract(rotatee, rotaterScaled, new CC3()); // using Pythagoras theorem
      const comp1 = scaleVector(c, vPerpAxis);
      const vPerpPerpAxis = CC3.cross(rotater, vPerpAxis, new CC3()); // perp to both of these
      const comp2 = scaleVector(s, vPerpPerpAxis);
      return addVectors([rotaterScaled, comp1, comp2]);
    }

    function dropOne(cartesian) {
      if (cartesian) {
        const cartographic = ellipsoid.cartesianToCartographic(cartesian);
        const longitudeString = CesiumMath.toDegrees(cartographic.longitude).toFixed(2);
        const latitudeString = CesiumMath.toDegrees(cartographic.latitude).toFixed(2);


        console.log(`(${ longitudeString }, ${ latitudeString })`);
      }
    }

    // horizon basics
    const dist = CC3.magnitude(camera.position);
    const angle = Math.asin(rad / dist);
    const toSurf = Math.sqrt(Math.pow(dist, 2) - Math.pow(rad, 2));

    // 'horizon arm'
    let rotatee = camera.position.clone();
    rotatee = CC3.negate(rotatee, new CC3());
    CC3.normalize(rotatee, rotatee);
    const rotater = new CC3(0, 0, 1);
    CC3.cross(rotatee, rotater, rotater);
    let rotated = new CC3(); let cartesian = new CC3();
    rotated = rotate(rotatee, rotater, angle);
    cartesian = scaleVector(toSurf, rotated);
    CC3.add(cartesian, camera.position, cartesian);


    // north
    dropOne(cartesian);

    // east
    cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
    dropOne(cartesian);

    // south
    cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
    dropOne(cartesian);

    // west
    cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
    dropOne(cartesian);


    // // view rectangle
    // const posUL = cam.pickEllipsoid(new Cartesian2(0, 0), Ellipsoid.WGS84);
    // const posLR = cam.pickEllipsoid(new Cartesian2(viewer.canvas.width, viewer.canvas.height), Ellipsoid.WGS84);
    // const posLL = cam.pickEllipsoid(new Cartesian2(0, viewer.canvas.height), Ellipsoid.WGS84);
    // const posUR = cam.pickEllipsoid(new Cartesian2(viewer.canvas.width, 0), Ellipsoid.WGS84);
    //
    // if (posUL) {
    //   // north
    //   let cartographic = ellipsoid.cartesianToCartographic(posUL);
    //   const maxLat = CesiumMath.toDegrees(cartographic.latitude).toFixed(2);
    //
    //
    //   // east
    //   cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
    //   cartographic = ellipsoid.cartesianToCartographic(posUR);
    //   const maxLon = CesiumMath.toDegrees(cartographic.longitude).toFixed(2);
    //
    //
    //   // south
    //   cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
    //   cartographic = ellipsoid.cartesianToCartographic(posLR);
    //   const minLat = CesiumMath.toDegrees(cartographic.latitude).toFixed(2);
    //
    //
    //   // west
    //   cartesian = rotate(cartesian, rotatee, Math.PI / 2); // rotatee now rotater
    //   cartographic = ellipsoid.cartesianToCartographic(posLL);
    //   const minLon = CesiumMath.toDegrees(cartographic.longitude).toFixed(2);
    //
    //   console.log(maxLat, maxLon, minLat, minLon);
    // }
  }

  renderContents() {
    const { viewerLoaded } = this.state;
    let contents = null;

    if (viewerLoaded) {
      const { scene } = this.viewer;
      const {
        flyToLocation, planes,
      } = this.props;

      contents = (
        <span>
          <CesiumProjectContents
            viewer={ this.viewer }
          />
          <CesiumCameraManager
            camera={ scene.camera }
            flyToLocation={ flyToLocation }
          />
        </span>
      );
    }

    return contents;
  }

  render() {
    const containerStyle = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'stretch',
    };

    const widgetStyle = {
      flexGrow: 2,
    };

    const contents = this.renderContents();

    return (
      <div className='cesiumGlobeWrapper' style={ containerStyle }>
        <div
          className='cesiumWidget'
          ref={ element => this.cesiumContainer = element }
          style={ widgetStyle }
        >
          {contents}
        </div>
      </div>
    );
  }
}
