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
import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';
import CallbackProperty from 'cesium/Source/DataSources/CallbackProperty';
import ConstantProperty from 'cesium/Source/DataSources/ConstantProperty';
import SampledPositionProperty from 'cesium/Source/DataSources/SampledPositionProperty';
import JulianDate from 'cesium/Source/Core/JulianDate';
import ExtrapolationType from 'cesium/Source/Core/ExtrapolationType';
import TimeIntervalCollection from 'cesium/Source/Core/TimeIntervalCollection';
import TimeInterval from 'cesium/Source/Core/TimeInterval';


import BlendOptions from 'cesium/Source/Scene/BlendOption';
import NearFarScalar from 'cesium/Source/Core/NearFarScalar';

import { actions as globeActions, selectors as globeSelectors } from '../../redux/globe';

const scratch = new Cartesian3();
const nfs = new NearFarScalar(5000, 3.25, 1000000, 1.5);
let now = JulianDate.now();
let future = JulianDate.addSeconds(now, 30, JulianDate.now());

class PlaneObj extends Object {
  constructor(icao, store, planeData) {
    super();
    this.store = store;
    this.planeData = planeData;
    this.icao = icao;
    this.data = null;
    this.entity = null;

    this.handleStoreUpdate = this.handleStoreUpdate.bind(this);
    this.updatePosition = this.updatePosition.bind(this);
    this.unsubscribe = this.store.subscribe(this.handleStoreUpdate);

    this.sampledPosition = new SampledPositionProperty();
    this.sampledPosition.forwardExtrapolationType = ExtrapolationType.HOLD;
    this.sampledPosition.backwardExtrapolationType = ExtrapolationType.HOLD;

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

    if (this.entity === null) {
      this.sampledPosition.addSample(now, position);
      this.entity = this.planeData.entities.add({
        point: {
          pixelSize: 2,
        },
        position: this.sampledPosition,
        scaleByDistance: nfs,
        id: this.icao,
      });
    } else {
      this.sampledPosition.addSample(future, position);
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

    this.planeData = new CustomDataSource('planedata');
    viewer.dataSources.add(this.planeData);

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
    now = JulianDate.now();
    future = JulianDate.addSeconds(now, 30, JulianDate.now());

    this.planeData.entities.suspendEvents();
    let count = 0;
    planes
      .forEach((v, k) => {
        if (!this.points[k]) {
          count += 1;
          this.points[k] = new PlaneObj(k, this.context.store, this.planeData);
        }
      });
    this.props.viewer.scene.requestRender();
    this.planeData.entities.resumeEvents();

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
