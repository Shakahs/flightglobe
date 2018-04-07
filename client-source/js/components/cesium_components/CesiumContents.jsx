import { connect } from 'react-redux';
import React from 'react';
import { bindActionCreators } from 'redux';
import { eq } from 'lodash-es';
import PropTypes from 'prop-types';

import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import PointPrimitiveCollection from 'cesium/Source/Scene/PointPrimitiveCollection';
import PolylineCollection from 'cesium/Source/Scene/PolylineCollection';
import Matrix4 from 'cesium/Source/Core/Matrix4';

import BlendOptions from 'cesium/Source/Scene/BlendOption';
import NearFarScalar from 'cesium/Source/Core/NearFarScalar';

import { actions as globeActions, selectors as globeSelectors } from '../../redux/globe';

const scratch = new Cartesian3();
const nfs = new NearFarScalar(5000, 3.25, 1000000, 1.5);

class PlaneObj extends Object {
  constructor(icao, store, pointCollection, polylineCollection) {
    super();
    this.store = store;
    this.pointCollection = pointCollection;
    this.polylineCollection = polylineCollection;
    this.icao = icao;
    this.data = null;
    this.point = null;
    this.polyline = null;
    this.updatePosition = this.updatePosition.bind(this);
    this.handleStoreUpdate = this.handleStoreUpdate.bind(this);
    this.unsubscribe = this.store.subscribe(this.handleStoreUpdate);
    this.handleStoreUpdate();
  }

  updatePosition() {
    const position = Cartesian3.fromDegrees(
      this.data.getIn(['positions', -1, 'lon']),
      this.data.getIn(['positions', -1, 'lat']),
      this.data.getIn(['positions', -1, 'altitude']),
      undefined,
      scratch
    );
    const polylineCoords = [];
    this.data.get('positions').forEach((polyPosition) => {
      polylineCoords.push(polyPosition.get('lon'));
      polylineCoords.push(polyPosition.get('lat'));
      polylineCoords.push(polyPosition.get('altitude'));
    });
    if (this.point === null) {
      this.point = this.pointCollection.add({
        position,
        pixelSize: 1,
        scaleByDistance: nfs,
        id: { icao: this.icao },
      });
    } else {
      this.point.position = position;
    }
    if (this.polyline === null && this.data.get('positions').size >= 2) {
      this.polyline = this.polylineCollection.add({
        positions: Cartesian3.fromDegreesArrayHeights(polylineCoords),
        width: 1,
        // material : Cesium.Color.RED
      });
    } else if (this.polyline !== null && this.data.get('positions').size >= 2) {
      console.log('add', polylineCoords);
      this.polyline.positions = polylineCoords;
    }
  }

  handleStoreUpdate() {
    const newData = globeSelectors.getPlane(this.store.getState(), this.icao);
    if (this.data !== newData) {
      this.data = newData;
      this.updatePosition();
    }
  }
}

class CesiumContents extends React.Component {
  constructor(props) {
    super(props);
    const { viewer } = props;
    const { scene } = viewer;
    scene.debugShowFramesPerSecond = true;

    this.pointCollection = scene.primitives.add(new PointPrimitiveCollection({ blendOption: BlendOptions.OPAQUE }));
    this.polylineCollection = scene.primitives.add(new PolylineCollection());

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
      const pickedObject = scene.pick(click.position);
      if (pickedObject) {
        this.props.globeActions.retrieveHistory(pickedObject.id._name);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    this.viewableArea = {
      north: null,
      south: null,
      west: null,
      east: null,
    };

    this.points = {};
  }

  shouldComponentUpdate(nextProps) {
    if (!eq(this.props.planes, nextProps.planes)) {
      this.updatePlanes();
    }
    return false;
  }

  componentDidUpdate() {
    this.updatePlanes();
    this.props.viewer.scene.requestRender();
  }

  componentWillUnmount() {
    if (this.pointCollection && !this.pointCollection.isDestroyed()) {
      this.pointCollection.destroy();
    }
  }

  updatePlanes() {
    const { planes } = this.props;

    let count = 0;
    planes
      .forEach((v, k) => {
        if (!this.points[k]) {
          count += 1;
          this.points[k] = new PlaneObj(k, this.context.store, this.pointCollection, this.polylineCollection);
        }
      });
    this.props.viewer.scene.requestRender();

    console.log('rendering planes', count);
  }
  render() {
    return (null);
  }
}

CesiumContents.contextTypes = { store: PropTypes.object };


const mapStateToProps = state => ({
  planes: globeSelectors.getPositions(state),
});

const mapDispatchToProps = dispatch => ({
  globeActions: bindActionCreators(globeActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(CesiumContents);
