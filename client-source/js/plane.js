import SampledPositionProperty from 'cesium/Source/DataSources/SampledPositionProperty';
import ExtrapolationType from 'cesium/Source/Core/ExtrapolationType';
import NearFarScalar from 'cesium/Source/Core/NearFarScalar';

const nfScalar = new NearFarScalar(5000, 3.25, 1000000, 1.5);

export default class PlaneObj extends Object {
  constructor(planeData, icao, position, date) {
    super();

    this.planeData = planeData;
    this.icao = icao;
    this.data = null;
    this.entity = null;

    // this.sampledPosition = new SampledPositionProperty();
    // this.sampledPosition.forwardExtrapolationType = ExtrapolationType.HOLD;
    // this.sampledPosition.backwardExtrapolationType = ExtrapolationType.HOLD;
    // this.sampledPosition.addSample(date, position);

    // this.updatePosition = this.updatePosition.bind(this);

    // this.sampledPosition.addSample(date, position);
    
    this.entity = this.planeData.entities.add({
      point: {
        pixelSize: 2,
      },
      // position: this.sampledPosition,
      position,
      scaleByDistance: nfScalar,
      id: this.icao,
    });

    this.updatePosition = this.updatePosition.bind(this);
  }

  updatePosition(position, date) {
    // this.sampledPosition.addSample(date, position);
    this.entity.position = position;
  }
}
