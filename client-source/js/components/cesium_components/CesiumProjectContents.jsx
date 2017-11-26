import React, { Component } from 'react';

import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';
import CesiumEntity from './primitives/CesiumEntity';
import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';

const _ = require('lodash');

export class CesiumProjectContents extends Component {
  constructor(props) {
    super(props);

    const { viewer } = props;
    const { scene } = viewer;

    this.planeData = new CustomDataSource('planedata');

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
      const pickedObject = scene.pick(click.position);
      if (pickedObject) {
        const entity = pickedObject.id;
        console.log(entity.id);
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
        key={ plane.id }
      />));

    return (
      <span>
        {renderedPlanes}
      </span>
    );
  }
}


export default CesiumProjectContents;
