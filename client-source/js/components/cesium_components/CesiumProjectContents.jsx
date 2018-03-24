import { connect } from 'react-redux';
import React from 'react';
import { bindActionCreators } from 'redux';
import { eq } from 'lodash-es';

import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';
import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';

import { actions as globeActions, selectors as globeSelectors } from '../../redux/globe';

class CesiumProjectContents extends React.Component {
  constructor(props) {
    super(props);
    const { viewer } = props;
    const { scene } = viewer;

    this.planeData = new CustomDataSource('planedata');

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
      const pickedObject = scene.pick(click.position);
      if (pickedObject) {
        this.props.globeActions.retrieveHistory(pickedObject.id._name);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    if (viewer) {
      viewer.dataSources.add(this.planeData);
    }

    this.viewableArea = {
      north: null,
      south: null,
      west: null,
      east: null,
    };
  }

  shouldComponentUpdate(nextProps) {
    if (!eq(this.props.planes, nextProps.planes)) {
      return true;
    }
    return false;
  }

  componentWillUpdate() {
    this.planeData.entities.suspendEvents();
  }

  componentDidUpdate() {
    this.planeData.entities.resumeEvents();
    this.props.viewer.scene.requestRender();
  }

  componentWillUnmount() {
    if (this.planeData && !this.planeData.isDestroyed()) {
      this.planeData.destroy();
    }
  }

  render() {
    const { planes } = this.props;

    let count = 0;
    const targetTime = new Date().getTime() - 1100;
    planes
      .filter((v, k) => {
        return v.get('modified') > targetTime || !this.planeData.entities.getById(k);
      })
      .forEach((v, k) => {
        count += 1;
        const entity = this.planeData.entities.getOrCreateEntity(k);
        entity.point = {
          'pixelSize': 5,
        };
        const position = Cartesian3.fromDegrees(
          v.get('lon'),
          v.get('lat'),
          v.get('altitude')
        );
        entity.position = position;
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
