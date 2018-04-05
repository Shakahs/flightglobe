import { connect } from 'react-redux';
import React from 'react';
import { bindActionCreators } from 'redux';
import { eq } from 'lodash-es';
import PropTypes from 'prop-types';

import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import PointPrimitiveCollection from 'cesium/Source/Scene/PointPrimitiveCollection';
import BlendOptions from 'cesium/Source/Scene/BlendOption';
import NearFarScalar from 'cesium/Source/Core/NearFarScalar';

import { actions as globeActions, selectors as globeSelectors } from '../../redux/globe';

const scratch = new Cartesian3();
const nfs = new NearFarScalar(5000, 3.25, 1000000, 1.5);

class PlaneObj extends Object {
  constructor(store, pointCollection, key, data) {
    super();
    this.store = store;
    this.pointCollection = pointCollection;
    this.key = key;
    this.data = data;
    const position = Cartesian3.fromDegrees(
      this.data.get('lon'),
      this.data.get('lat'),
      this.data.get('altitude'),
      undefined,
      scratch
    );
    this.point = this.pointCollection.add({
      position,
      pixelSize: 1,
      scaleByDistance: nfs,
      id: { icao: key },
    });
    this.updatePosition = this.updatePosition.bind(this);
    this.handleStoreUpdate = this.handleStoreUpdate.bind(this);
    this.unsubscribe = this.store.subscribe(this.handleStoreUpdate);
  }

  updatePosition() {
    this.point.position = Cartesian3.fromDegrees(
      this.data.get('lon'),
      this.data.get('lat'),
      this.data.get('altitude'),
      undefined,
      scratch
    );
    // console.log('position updated for', this.key);
  }

  handleStoreUpdate() {
    const newData = globeSelectors.getPlane(this.store.getState(), this.key);
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
    const targetTime = new Date().getTime() - 1100;


    planes
      .filter((v) => {
        return v.get('modified') > targetTime;
      })
      .forEach((v, k) => {
        // const position = Cartesian3.fromDegrees(
        //   v.get('lon'),
        //   v.get('lat'),
        //   v.get('altitude'),
        //   undefined,
        //   scratch
        // );
        if (!this.points[k]) {
          count += 1;
          this.points[k] = new PlaneObj(this.context.store, this.pointCollection, k, v);
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
