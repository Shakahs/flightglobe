import {
   LabelCollection,
   PointPrimitiveCollection,
   PolylineCollection,
   Viewer
} from "cesium";

export class CesiumPrimitiveHandler {
   viewer: Viewer;
   points: PointPrimitiveCollection;
   labels: LabelCollection;
   lines: PolylineCollection;

   constructor(viewer: Viewer) {
      this.viewer = viewer;
      //points
      this.points = new PointPrimitiveCollection();
      viewer.scene.primitives.add(this.points);
      //labels
      this.labels = new LabelCollection();
      viewer.scene.primitives.add(this.labels);
      //lines
      this.lines = new PolylineCollection();
      viewer.scene.primitives.add(this.lines);
   }

   // render(fs: IterableIterator<[string, FlightSubscriber]>) {
   //    let done=false
   //     let res
   //     while(!done){
   //        res = fs.next().
   //     }
   // }

   render() {}

   destroy() {
      this.points.destroy();
      this.labels.destroy();
      this.lines.destroy();
   }
}
