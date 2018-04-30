import SampledPositionProperty from 'cesium/Source/DataSources/SampledPositionProperty';
import ExtrapolationType from 'cesium/Source/Core/ExtrapolationType';
import NearFarScalar from 'cesium/Source/Core/NearFarScalar';

const nfScalar = new NearFarScalar(5000, 3.25, 1000000, 1.5);

export default class PlaneObj extends Object {
  constructor(planeData, icao, position, now) {
    super();

    this.planeData = planeData;
    this.icao = icao;
    this.data = null;
    this.entity = null;

    this.sampledPosition = new SampledPositionProperty();
    this.sampledPosition.forwardExtrapolationType = ExtrapolationType.HOLD;
    this.sampledPosition.backwardExtrapolationType = ExtrapolationType.HOLD;

    this.updatePosition = this.updatePosition.bind(this);

    this.sampledPosition.addSample(now, position);
    this.entity = this.planeData.entities.add({
      point: {
        pixelSize: 2,
      },
      position: this.sampledPosition,
      scaleByDistance: nfScalar,
      id: this.icao,
    });
  }

  updatePosition(future, position) {
    this.sampledPosition.addSample(future, position);
  }
}
