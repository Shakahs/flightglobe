import {
   LabelCollection,
   PointPrimitiveCollection,
   PolylineCollection,
   Viewer
} from "cesium";

export class GeoCollection {
   id: string;
   points: PointPrimitiveCollection;
   labels: LabelCollection;
   lines: PolylineCollection;
   viewer: Viewer;

   constructor(id: string, viewer: Viewer) {
      this.id = id;
      this.viewer = viewer;
      this.points = new PointPrimitiveCollection();
      this.labels = new LabelCollection();
      this.lines = new PolylineCollection();
      viewer.scene.primitives.add(this.points);
      viewer.scene.primitives.add(this.labels);
      viewer.scene.primitives.add(this.lines);
   }

   destroy() {
      this.points.destroy();
      this.labels.destroy();
   }
}
