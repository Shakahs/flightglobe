import { Component } from 'react';

import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import HorizontalOrigin from 'cesium/Source/Scene/HorizontalOrigin';
import VerticalOrigin from 'cesium/Source/Scene/VerticalOrigin';
import DistanceDisplayCondition from 'cesium/Source/Core/DistanceDisplayCondition';


import { shallowEqual } from '../../../utils/utils';

export default class CesiumEntity extends Component {
  constructor(props) {
    super(props);
    const { planeData } = this.props;
    this.entity = planeData.entities.getOrCreateEntity(props.plane.id);
    this.entity.model = props.planeModel;
    this.entity.position = Cartesian3.fromDegrees(props.plane.lon, props.plane.lat, 5000);
  }


  componentDidMount() {
    // const { entityCollection } = this.props;
    // this.entity = entityCollection.getOrCreateEntity('');
    this.updateEntity();
  }

  componentDidUpdate(prevProps) {
    if (!shallowEqual(this.props, prevProps)) {
      this.updateEntity();
    }
  }

  updateEntity() {
    if (this.entity) {
      this.entity.position = Cartesian3.fromDegrees(this.props.plane.lon, this.props.plane.lat, 5000);
    }
    // console.log(this.entity);
  }

  render() {
    return null;
  }
}
