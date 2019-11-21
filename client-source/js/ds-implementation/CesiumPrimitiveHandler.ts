import {
   Cartesian2,
   Color,
   GeometryInstance,
   Label,
   LabelCollection,
   PointPrimitive,
   PointPrimitiveCollection,
   PolylineColorAppearance,
   PolylineGeometry,
   Primitive,
   PrimitiveCollection,
   Viewer
} from "cesium";
import { FlightSubscriberMap } from "./types";
import { FlightSubscriber } from "./FlightSubscriber";
import { map } from "lodash";
import { convertPositionToCartesian } from "../ws-implementation/utility";
import {
   LabelDisplayOptionDefaults,
   PointDisplayOptionDefaults
} from "../constants";

require("./mobxConfig");

interface CesiumPrimitiveHolder {
   point?: PointPrimitive;
   label?: Label;
   line?: Primitive;
}

const labelOffset = new Cartesian2(10, 20);

export class CesiumPrimitiveHandler {
   private readonly viewer: Viewer;
   private readonly points = new PointPrimitiveCollection();
   private readonly labels = new LabelCollection();
   private readonly lines = new PrimitiveCollection();
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
            this.reconcileLine(child, f);
            f.needsRender = false;
         }
      });
      this.viewer.scene.requestRender();
   }

   renderPoint(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      if (child.point) {
         child.point.position = f.cartesianPosition;
         child.point.show = f.shouldDisplay;
      } else {
         child.point = this.points.add({
            position: f.cartesianPosition,
            id: f.icao,
            show: f.shouldDisplay
         });
      }
      child.point.color = PointDisplayOptionDefaults.cesiumColor;
      child.point.pixelSize = PointDisplayOptionDefaults.size;
      child.point.outlineColor = Color.fromCssColorString(
         PointDisplayOptionDefaults.outlineColor
      );
      child.point.outlineWidth = PointDisplayOptionDefaults.outlineSize;
   }

   reconcileLabel(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      if (f.demographic && f.shouldDisplayDetailed && f.shouldDisplay) {
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
      child.label.fillColor = LabelDisplayOptionDefaults.cesiumColor;
      child.label.font = `${LabelDisplayOptionDefaults.size}px sans-serif`;
   }

   destroyLabel(child: CesiumPrimitiveHolder) {
      if (child.label) {
         this.labels.remove(child.label);
         child.label = undefined;
      }
   }

   reconcileLine(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      if (
         f.trackFull.length >= 2 && //require at least 2 positions to render a line
         f.shouldDisplayDetailed &&
         f.shouldDisplay
      ) {
         this.renderLine(child, f);
      } else {
         this.destroyLine(child, f);
      }
   }

   renderLine(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      const cartesianPositions = map(f.trackFull, convertPositionToCartesian);
      const gradientColors: Color[] = [];
      cartesianPositions.forEach(() => {
         gradientColors.push(Color.fromRandom());
      });

      const newLine = new Primitive({
         asynchronous: false,
         geometryInstances: new GeometryInstance({
            geometry: PolylineGeometry.createGeometry(
               new PolylineGeometry({
                  positions: cartesianPositions,
                  width: 5,
                  // vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                  colors: gradientColors,
                  colorsPerVertex: true
               })
            )
         }),
         appearance: new PolylineColorAppearance({
            translucent: true
         })
      });
      this.destroyLine(child, f);
      child.line = newLine;
      this.lines.add(child.line);
   }

   destroyLine(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      if (child.line) {
         this.lines.remove(child.line);
         child.line = undefined;
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
