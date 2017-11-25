import React, { Component } from 'react';

import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';
import CesiumEntity from './primitives/CesiumEntity';
import ModelGraphics from 'cesium/Source/DataSources/ModelGraphics';

const _ = require('lodash');

export class CesiumProjectContents extends Component {
  constructor(props) {
    super(props);

    const { viewer } = props;

    this.planeData = new CustomDataSource('planedata');
    this.planeModel = new ModelGraphics({
      uri: '/static/Cesium_Air.gltf',
      minimumPixelSize: 32,
      runAnimations: false,
    });

    if (viewer) {
      viewer.dataSources.add(this.planeData);
      // viewer.dataSources.add(this.planeData).then(() => { console.log('data source added'); });
    }
  }

  componentWillUnmount() {
    if (!this.planeData.isDestroyed()) {
      this.planeData.destroy();
    }
  }

  render() {
    const { planes } = this.props;

    const renderedPlanes = _.map(planes, (plane) =>
      (<CesiumEntity
        plane={ plane }
        planeData={ this.planeData }
        planeModel={ this.planeModel }
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
