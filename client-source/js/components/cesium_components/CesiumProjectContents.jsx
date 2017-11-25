import React, { Component } from 'react';

import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';
import CesiumEntity from './primitives/CesiumEntity';

const _ = require('lodash')

export class CesiumProjectContents extends Component {
  constructor(props) {
    super(props);

    this.planeData = new CustomDataSource('planedata');

    this.primitiveCollections = [this.planeData];

    const { viewer } = props;

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
