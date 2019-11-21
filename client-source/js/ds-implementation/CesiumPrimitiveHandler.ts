import {
   Cartesian2,
   Cartesian3,
   Label,
   LabelCollection,
   PointPrimitive,
   PointPrimitiveCollection,
   Polyline,
   PolylineCollection,
   Viewer
} from "cesium";
import { FlightSubscriberMap } from "./types";
import { FlightSubscriber } from "./FlightSubscriber";

require("./mobxConfig");

interface CesiumPrimitiveHolder {
   point?: PointPrimitive;
   label?: Label;
   line?: Polyline;
}

const labelOffset = new Cartesian2(10, 20);

export class CesiumPrimitiveHandler {
   private readonly viewer: Viewer;
   private readonly points: PointPrimitiveCollection = new PointPrimitiveCollection();
   private readonly labels: LabelCollection = new LabelCollection();
   private readonly lines: PolylineCollection = new PolylineCollection();
   private readonly children: Map<string, CesiumPrimitiveHolder>;

   constructor(viewer: Viewer) {
      this.viewer = viewer;
      viewer.scene.primitives.add(this.points);
      viewer.scene.primitives.add(this.labels);
      viewer.scene.primitives.add(this.lines);
      this.children = new Map();
   }

   getChild(icao: string): CesiumPrimitiveHolder {
      let child: CesiumPrimitiveHolder | undefined;
      child = this.children.get(icao);
      if (child) {
         return child;
      } else {
         child = {};
         this.children.set(icao, child);
      }
      return child;
   }

   render(fs: FlightSubscriberMap) {
      fs.forEach((f) => {
         const child = this.getChild(f.icao);
         if (f.needsRender) {
            this.renderPoint(child, f);
            this.reconcileLabel(child, f);
            f.needsRender = false;
         }
      });
      this.viewer.scene.requestRender();
   }

   renderPoint(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      if (child.point) {
         child.point.position = f.cartesianPosition;
      } else {
         child.point = this.points.add({
            position: f.cartesianPosition
         });
      }
   }

   reconcileLabel(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      if (f.demographic && f.isDetailSelected) {
         this.renderLabel(child, f);
      } else {
         this.destroyLabel(child);
      }
   }

   renderLabel(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      const labelText = `${f.icao}\n${f.demographic?.origin}\n${f.demographic?.destination}`;

      if (child.label) {
         child.label.position = f.cartesianPosition;
         child.label.text = labelText;
      } else {
         child.label = this.labels.add({
            position: f.cartesianPosition,
            text: labelText,
            pixelOffset: labelOffset,
            outlineWidth: 2.0
         });
      }
   }

   destroyLabel(child: CesiumPrimitiveHolder) {
      if (child.label) {
         this.labels.remove(child.label);
         child.label = undefined;
      }
   }

   getPoints(): PointPrimitiveCollection {
      return this.points;
   }

   destroy() {
      this.points.destroy();
      this.labels.destroy();
      this.lines.destroy();
   }
}
