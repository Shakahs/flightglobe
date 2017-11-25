import React, { Component } from 'react';

import BillboardCollection from 'cesium/Source/Scene/BillboardCollection';
import EntityCollection from 'cesium/Source/DataSources/EntityCollection';
import LabelCollection from 'cesium/Source/Scene/LabelCollection';
import PolylineCollection from 'cesium/Source/Scene/PolylineCollection';
import CustomDataSource from 'cesium/Source/DataSources/CustomDataSource';

import CesiumBillboard from './primitives/CesiumBillboard';
import CesiumLabel from './primitives/CesiumLabel';
import CesiumPolyline from './primitives/CesiumPolyline';
import CesiumEntity from './primitives/CesiumEntity';

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

    const renderedPlanes = planes.map((plane) =>
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
