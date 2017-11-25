import { Component } from 'react';

import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import HeadingPitchRoll from 'cesium/Source/Core/HeadingPitchRoll';
import CesiumMath from 'cesium/Source/Core/Math';
import Transforms from 'cesium/Source/Core/Transforms';

import { shallowEqual } from '../../../utils/utils';

export default class CesiumEntity extends Component {
  constructor(props) {
    super(props);
    const { planeData } = this.props;
    this.entity = planeData.entities.getOrCreateEntity(props.plane.id);
    this.entity.point = {
      'pixelSize': 5,
    };
    // this.entity.model = props.planeModel;
    // this.entity.position = Cartesian3.fromDegrees(
    //   props.plane.lon,
    //   props.plane.lat,
    //   props.plane.altitude
    // );
    // const hpr = new HeadingPitchRoll(props.plane.heading, 0, 0);
    // this.entity.orientation = Transforms.headingPitchRollQuaternion(this.entity.position, hpr);
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
    const position = Cartesian3.fromDegrees(
      this.props.plane.lon,
      this.props.plane.lat,
      this.props.plane.altitude
    );
    this.entity.position = position;
    const heading = CesiumMath.toRadians(this.props.plane.heading - 90);
    const hpr = new HeadingPitchRoll(heading, 0, 0);
    this.entity.orientation = Transforms.headingPitchRollQuaternion(position, hpr);
  }

  render() {
    return null;
  }
}
