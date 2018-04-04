// React + Cesium implementation forked from here https://github.com/markerikson/cesium-react-webpack-demo
import React, { Component } from 'react';

import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import BingMapsImageryProvider from 'cesium/Source/Scene/BingMapsImageryProvider';
import CesiumTerrainProvider from 'cesium/Source/Core/CesiumTerrainProvider';

import CesiumProjectContents from './CesiumContents';
import CesiumCameraManager from './CesiumCameraManager';

const BING_MAPS_URL = '//dev.virtualearth.net';
const BING_MAPS_KEY = 'ApDPY15x9lCXO5Hw89M1G5Q84_BlKalPbjor8GvKGj2UAnVtzlT5UT-zrylU1e48';
const STK_TERRAIN_URL = '//assets.agi.com/stk-terrain/world';

export default class CesiumRoot extends Component {
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
    // this.viewer.camera.rotateLeft();
    // this.viewer.camera.changed.addEventListener(() => {
    //   const ellipsoid = this.viewer.scene.globe.ellipsoid;
    //   const cameraHeight = ellipsoid.cartesianToCartographic(this.viewer.camera.position).height;
    // console.log(`camera height is${ cameraHeight }`);
    // });

    // Force immediate re-render now that the Cesium viewer is created
    this.setState({ viewerLoaded: true }); // eslint-disable-line react/no-did-mount-set-state
  }

  componentWillUnmount() {
    if (this.viewer) {
      this.viewer.destroy();
    }
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
