import { Component } from 'react';
import { eq } from 'lodash-es';

import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import HeadingPitchRoll from 'cesium/Source/Core/HeadingPitchRoll';
import CesiumMath from 'cesium/Source/Core/Math';
import Transforms from 'cesium/Source/Core/Transforms';

export default class Plane extends Component {
  constructor(props) {
    super(props);
    const { planeData, icao } = this.props;
    this.entity = planeData.entities.getOrCreateEntity(icao);
    this.entity.name = props.plane.icao;
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

  shouldComponentUpdate(nextProps) {
    if (!eq(this.props.plane, nextProps.plane)) {
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    this.updateEntity();
  }

  componentWillUnmount() {
    this.props.pointCollection.entities.removeById(this.props.icao);
  }

  updateEntity() {
    const { plane } = this.props;
    const position = Cartesian3.fromDegrees(
      plane.get('lon'),
      plane.get('lat'),
      plane.get('altitude')
    );
    this.entity.position = position;
    const heading = CesiumMath.toRadians(plane.get('heading') - 90);
    const hpr = new HeadingPitchRoll(heading, 0, 0);
    this.entity.orientation = Transforms.headingPitchRollQuaternion(position, hpr);
  }

  render() {
    return null;
  }
}
