import * as Cesium from 'cesium';

// import {NearFarScalar} from 'cesium';
import {FlightPosition, FlightPositionMap, Icao, PositionUpdate,} from './types'
// import {Cartesian3, PointGraphics, Entity} from "cesium";
import {Flight} from './types'


const nfScalar = new Cesium.NearFarScalar(5000, 3.25, 1000000, 1.5);
const labelDisplayCondition = new Cesium.DistanceDisplayCondition(0.0, 2000000);
const labelOffset = new Cesium.Cartesian2(10,20);

export const createEntity = (update: PositionUpdate, position: Cesium.Cartesian3):Cesium.Entity => {

    const plane = update.body;
    const newEntity  = new Cesium.Entity({
        // point: new PointGraphics({pixelSize: 2, scaleByDistance: nfScalar}),
        point: new Cesium.PointGraphics({pixelSize: 2}),
        // position: this.sampledPosition,
        position,
        id: update.icao,
        // polyline: new Cesium.PolylineGraphics()
        //@ts-ignore
        // label: new Cesium.LabelGraphics({text: `${plane.icao}\n${plane.origin}\n${plane.destination}`, font: '12px sans-serif',
            //@ts-ignore
            // distanceDisplayCondition: labelDisplayCondition, pixelOffset: labelOffset})
    });

    return newEntity
};

// export class Flight implements PlaneObj {
//   constructor(cesiumPlaneDataSource: FlightPositionMap, icao: Icao, position: FlightPosition) {
//     // super(cesiumPlaneDataSource, icao, position);
//
//     this.cesiumPlaneDataSource = cesiumPlaneDataSource;
//     this.icao = icao;
//
//     // this.sampledPosition = new SampledPositionProperty();
//     // this.sampledPosition.forwardExtrapolationType = ExtrapolationType.HOLD;
//     // this.sampledPosition.backwardExtrapolationType = ExtrapolationType.HOLD;
//     // this.sampledPosition.addSample(date, position);
//
//     // this.updatePosition = this.updatePosition.bind(this);
//
//     // this.sampledPosition.addSample(date, position);
//
//     this.entity = this.cesiumPlaneDataSource.entities.add(new Cesium.Entity({
//         // point: new PointGraphics({pixelSize: 2, scaleByDistance: nfScalar}),
//         point: new Cesium.PointGraphics({pixelSize: 2}),
//         // position: this.sampledPosition,
//         position,
//         id: this.icao,
//     }));
//
//     this.updatePosition = this.updatePosition.bind(this);
//   }
//
//   updatePosition(position) {
//     // this.sampledPosition.addSample(date, position);
//     this.entity.position = position;
//   }
// }
