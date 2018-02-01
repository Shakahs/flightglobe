import { connect } from 'react-redux';
import React  from 'react';
import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';
import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';
import CesiumEntity from './primitives/CesiumEntity';
import { selectors as globeSelectors } from '../../redux/globe';

const _ = require('lodash');

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
        const entity = pickedObject.icao;
        console.log(entity.icao);
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

    const renderedPlanes = _.map(planes, (plane) =>
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

export default connect(mapStateToProps)(CesiumProjectContents);
