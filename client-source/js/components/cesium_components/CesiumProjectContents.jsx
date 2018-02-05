import { connect } from 'react-redux';
import React from 'react';
import { bindActionCreators } from 'redux';
import { map } from 'lodash-es';
import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';
import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';
import CesiumEntity from './primitives/CesiumEntity';
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
        this.props.globeActions.retrieveHistory(pickedObject.id._id);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    if (viewer) {
      viewer.dataSources.add(this.planeData);
    }
  }

  componentWillUnmount() {
    if (this.planeData && !this.planeData.isDestroyed()) {
      this.planeData.destroy();
    }
  }

  render() {
    const { planes } = this.props;
    console.log('rendering planes', planes.length);

    const renderedPlanes = map(planes, (plane) =>
      (<CesiumEntity
        plane={ plane }
        planeData={ this.planeData }
        key={ plane.icao }
      />));

    return (
      <span>
        {renderedPlanes}
      </span>
    );
  }
}

const mapStateToProps = state => ({
  planes: globeSelectors.getPositions(state),
});

const mapDispatchToProps = dispatch => ({
  globeActions: bindActionCreators(globeActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(CesiumProjectContents);
