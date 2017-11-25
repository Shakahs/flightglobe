import { Component } from 'react';

import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import SSET from 'cesium/Source/Core/ScreenSpaceEventType';
import CesiumMath from 'cesium/Source/Core/Math';

import { noop } from '../../utils/utils';

export default class CesiumClickHandler extends Component {
  constructor(props) {
    super(props);
    this.pickMapCoordinates = this.pickMapCoordinates.bind(this);
    this.onMouseLeftClick = this.onMouseLeftClick.bind(this);
    this.createInputHandlers = this.createInputHandlers.bind(this);
  }

  componentDidMount() {
    const { scene } = this.props;

    if (scene && scene.canvas) {
      this.screenEvents = new ScreenSpaceEventHandler(scene.canvas);
      this.createInputHandlers();
    }
  }

  componentWillUnmount() {
    if (this.screenEvents && !this.screenEvents.isDestroyed()) {
      this.screenEvents.destroy();
    }
  }

  onMouseLeftClick(e) {
    const { position: clientPos } = e;
    const mapCoordsRadians = this.pickMapCoordinates(clientPos);

    if (mapCoordsRadians) {
      const mapCoordsDegrees = {
        lat: CesiumMath.toDegrees(mapCoordsRadians.latitude),
        lon: CesiumMath.toDegrees(mapCoordsRadians.longitude),
      };

      this.props.onLeftClick(mapCoordsDegrees);
    }
  }

  createInputHandlers() {
    this.screenEvents.setInputAction(this.onMouseLeftClick, SSET.LEFT_CLICK);
  }

  pickMapCoordinates(screenPos) {
    const { scene } = this.props;
    let mapCoords;

    if (scene) {
      const cartesianPos = scene.camera.pickEllipsoid(screenPos);

      if (cartesianPos) {
        mapCoords = scene.globe.ellipsoid.cartesianToCartographic(cartesianPos);
      }
    }

    return mapCoords;
  }


  render() {
    return null;
  }
}

CesiumClickHandler.defaultProps = {
  onLeftClick: noop,
};
