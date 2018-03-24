import { connect } from 'react-redux';
import React from 'react';
import { bindActionCreators } from 'redux';
import { eq } from 'lodash-es';

import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import PointPrimitiveCollection from 'cesium/Source/Scene/PointPrimitiveCollection';
import BlendOptions from 'cesium/Source/Scene/BlendOption';
import NearFarScalar from 'cesium/Source/Core/NearFarScalar';

import { actions as globeActions, selectors as globeSelectors } from '../../redux/globe';

class CesiumProjectContents extends React.Component {
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
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    this.props.viewer.scene.requestRender();
  }

  componentWillUnmount() {
    if (this.pointCollection && !this.pointCollection.isDestroyed()) {
      this.pointCollection.destroy();
    }
  }

  render() {
    const { planes } = this.props;

    let count = 0;
    const scratch = new Cartesian3();
    const targetTime = new Date().getTime() - 1100;
    const nfs = new NearFarScalar(5000, 3.25, 1000000, 1.5);

    planes
      .filter((v) => {
        return v.get('modified') > targetTime;
      })
      .forEach((v, k) => {
        count += 1;
        const position = Cartesian3.fromDegrees(
          v.get('lon'),
          v.get('lat'),
          v.get('altitude'),
          undefined,
          scratch
        );
        if (!this.points[k]) {
          this.points[k] = this.pointCollection.add({
            position,
            pixelSize: 1,
            scaleByDistance: nfs,
          });
        } else {
          this.points[k].position = position;
        }
      });

    console.log('rendering planes', count);
    return (null);
  }
}

const mapStateToProps = state => ({
  planes: globeSelectors.getPositions(state),
});

const mapDispatchToProps = dispatch => ({
  globeActions: bindActionCreators(globeActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(CesiumProjectContents);
