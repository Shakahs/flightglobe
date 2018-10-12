import SampledPositionProperty from 'cesium/Source/DataSources/SampledPositionProperty';
import ExtrapolationType from 'cesium/Source/Core/ExtrapolationType';
import NearFarScalar from 'cesium/Source/Core/NearFarScalar';
import {Icao, Plane} from './index'
import {Cartesian3, PointGraphics, Entity} from "cesium";

const nfScalar = new NearFarScalar(5000, 3.25, 1000000, 1.5);

export default class PlaneObj extends Plane {
  constructor(planeData, icao, position) {
    super(planeData, icao, position);

    this.planeData = planeData;
    this.icao = icao;

    // this.sampledPosition = new SampledPositionProperty();
    // this.sampledPosition.forwardExtrapolationType = ExtrapolationType.HOLD;
    // this.sampledPosition.backwardExtrapolationType = ExtrapolationType.HOLD;
    // this.sampledPosition.addSample(date, position);

    // this.updatePosition = this.updatePosition.bind(this);

    // this.sampledPosition.addSample(date, position);
    
    this.entity = this.planeData.entities.add(new Entity({
        point: new PointGraphics({pixelSize: 2, scaleByDistance: nfScalar}),
        // position: this.sampledPosition,
        position,
        id: this.icao,
    }));

    this.updatePosition = this.updatePosition.bind(this);
  }

  updatePosition(position, date) {
    // this.sampledPosition.addSample(date, position);
    this.entity.position = position;
  }
}
