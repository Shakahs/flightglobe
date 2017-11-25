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
    this.entity = planeData.entities.getOrCreateEntity(this.props.plane.id);
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
      const newLocation = Cartesian3.fromDegrees(this.props.plane.lon, this.props.plane.lat, 0);

      this.entity.position = newLocation;
      this.entity.show = true;
      this.entity.scale = 1.0;

      this.entity.box = {
        dimensions: Cartesian3.fromElements(50000, 50000, 50000),
        distanceDisplayCondition: new DistanceDisplayCondition(0.0, Number.MAX_VALUE),
      };
    }
    // console.log(this.entity);
  }

  render() {
    return null;
  }
}
