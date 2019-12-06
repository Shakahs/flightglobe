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
import {
   LabelDisplayOptionDefaults,
   PointDisplayOptionDefaults
} from "../constants";
import { interpolate } from "d3-interpolate";
import { color, RGBColor } from "d3-color";
import { memoize } from "lodash";
import { FlightPosition } from "../../../lib/types";
import { convertPositionToCartesian } from "./utility";
const airports = require("../../resources/airports.json");

require("./mobxConfig");

interface CesiumPrimitiveHolder {
   point?: PointPrimitive;
   label?: Label;
   track?: Primitive;
}

const labelOffset = new Cartesian2(10, 20);
const colorInterpolator = interpolate("red", "white");

const CesiumColorFromAltitude = (
   position: FlightPosition,
   interpolator: (t: number) => string
): Color => {
   const newColor = color(interpolator(position.altitude / 50000)) as RGBColor;
   return Color.fromBytes(newColor.r, newColor.g, newColor.b);
};

memoize.Cache = WeakMap;
const memoizedCesiumColorFromAltitude = memoize(CesiumColorFromAltitude);

export class CesiumPrimitiveHandler {
   private readonly viewer: Viewer;
   private readonly points = new PointPrimitiveCollection();
   private readonly labels = new LabelCollection();
   private readonly tracks = new PrimitiveCollection();
   private readonly children: Map<string, CesiumPrimitiveHolder>;

   constructor(viewer: Viewer) {
      this.viewer = viewer;
      viewer.scene.primitives.add(this.points);
      viewer.scene.primitives.add(this.labels);
      viewer.scene.primitives.add(this.tracks);
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
            this.reconcileTrack(child, f);
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
      // child.point.color = PointDisplayOptionDefaults.cesiumColor;
      child.point.color = memoizedCesiumColorFromAltitude(
         f.position,
         colorInterpolator
      );
      child.point.pixelSize = PointDisplayOptionDefaults.size;
      child.point.outlineColor = Color.fromCssColorString(
         PointDisplayOptionDefaults.outlineColor
      );
      child.point.outlineWidth = PointDisplayOptionDefaults.outlineSize;
   }

   reconcileLabel(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      if (f.shouldDisplayLabel) {
         this.renderLabel(child, f);
      } else {
         this.destroyLabel(child);
      }
   }

   renderLabel(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      let oCity = f.demographic?.origin;
      if (f.demographic?.origin && airports[f.demographic.origin]?.city) {
         oCity = airports[f.demographic.origin].city;
      }

      let dCity = f.demographic?.destination;
      if (
         f.demographic?.destination &&
         airports[f.demographic.destination]?.city
      ) {
         dCity = airports[f.demographic.destination].city;
      }

      const labelText = `${f.icao}\n${oCity}\n${dCity}\n${f.position.altitude} ft`;

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
      // child.label.fillColor = LabelDisplayOptionDefaults.cesiumColor;
      child.label.fillColor = memoizedCesiumColorFromAltitude(
         f.position,
         colorInterpolator
      );
      child.label.font = `${LabelDisplayOptionDefaults.size}px sans-serif`;
   }

   destroyLabel(child: CesiumPrimitiveHolder) {
      if (child.label) {
         this.labels.remove(child.label);
         child.label = undefined;
      }
   }

   reconcileTrack(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      if (f.shouldDisplayTrack) {
         this.renderTrack(child, f);
      } else {
         this.destroyTrack(child, f);
      }
   }

   renderTrack(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      const cartesianPositions = map(f.trackFull, convertPositionToCartesian);
      const gradientColors: Color[] = [];

      for (let i = 0; i < f.trackFull.length; i++) {
         gradientColors.push(
            memoizedCesiumColorFromAltitude(f.trackFull[i], colorInterpolator)
         );
      }

      const newTrack = new Primitive({
         asynchronous: false,
         geometryInstances: new GeometryInstance({
            id: f.icao,
            geometry: PolylineGeometry.createGeometry(
               new PolylineGeometry({
                  positions: cartesianPositions,
                  width: 3,
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
      this.destroyTrack(child, f);
      child.track = newTrack;
      this.tracks.add(child.track);
   }

   destroyTrack(child: CesiumPrimitiveHolder, f: FlightSubscriber) {
      if (child.track) {
         this.tracks.remove(child.track);
         child.track = undefined;
      }
   }

   getPoints(): PointPrimitiveCollection {
      return this.points;
   }

   destroy() {
      this.points.destroy();
      this.labels.destroy();
      this.tracks.destroy();
   }
}
