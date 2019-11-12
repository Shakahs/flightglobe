import { flightObj, flightStore } from "./mockSetup";
import {
   FlightADemographic,
   FlightAPosition1,
   FlightAPosition2,
   FlightBPosition1
} from "./mockData";
import { FlightObj } from "../flightObj";
import { Cartesian3, Color, Label, PointPrimitive, Polyline } from "cesium";
import { get } from "lodash-es";
import {
   LabelDisplayOptionDefaults,
   PointDisplayOptionDefaults,
   TrailDisplayOptionDefaults
} from "../flightStore";
import { FlightPosition, FlightRecord } from "../../../../lib/types";
import { newICAOMap } from "../utility";

describe("FlightObj", function() {
   it("stores the correct FlightRecord", function() {
      const flightRecord = flightStore.flightData.get(
         FlightAPosition1.icao
      ) as FlightRecord;
      expect(flightObj.flightRecord).toEqual(flightRecord);
   });

   it("stores the correct id", function() {
      expect(flightObj.icao).toEqual(FlightAPosition1.icao);
   });

   describe("computes essential data", function() {
      describe("by computing selection status", function() {
         it("if a flight is selected", function() {
            expect(flightObj.isSelected).toEqual(false);
            flightStore.updateSelectedFlight(
               new Map<string, boolean>([[FlightAPosition1.icao, true]])
            );
            expect(flightObj.isSelected).toEqual(true);
         });

         it("if a flight is detail selected", function() {
            expect<boolean>(flightObj.isDetailSelected).toBeFalsy();
            flightStore.updateDetailedFlights(
               new Map([[FlightAPosition1.body.geohash, true]])
            );
            expect<boolean>(flightObj.isDetailSelected).toBeTruthy();
         });

         it("if a flight is filter selected", function() {
            expect(flightObj.isFilterSelected).toBeFalsy();
            flightStore.updateFilteredFlights(
               newICAOMap([FlightBPosition1.icao])
            );
            expect(flightObj.isFilterSelected).toBeFalsy();
            flightStore.updateFilteredFlights(
               newICAOMap([FlightAPosition1.icao, FlightBPosition1.icao])
            );
            expect(flightObj.isFilterSelected).toBeTruthy();
         });
      });

      describe("by determining visibility", function() {
         it("when there are no filters or selection", function() {
            expect(flightObj.shouldDisplay).toBeTruthy();
         });

         it("when a flight is filtered out", function() {
            expect(flightObj.shouldDisplay).toBeTruthy();
            const dummyMap = new Map<string, boolean>([["zzzz", true]]);
            flightStore.updateFilteredFlights(dummyMap);
            flightStore.updateIsFiltered(true);
            expect(flightObj.shouldDisplay).toBeFalsy();
         });

         it("when a flight is filtered in", function() {
            expect(flightObj.shouldDisplay).toBeTruthy();
            const dummyMap = new Map<string, boolean>([
               [FlightAPosition1.icao, true]
            ]);
            flightStore.updateFilteredFlights(dummyMap);
            expect(flightObj.shouldDisplay).toBeTruthy();
         });

         it("when a flight is filtered out, but also selected", function() {
            expect(flightObj.shouldDisplay).toBeTruthy(); //visible by default
            const dummyMap = new Map<string, boolean>([["zzzz", true]]);
            flightStore.updateFilteredFlights(dummyMap);
            flightStore.updateIsFiltered(true);
            expect(flightObj.shouldDisplay).toBeFalsy(); //filtered out
            flightStore.updateSelectedFlight(
               new Map<string, boolean>([[FlightAPosition1.icao, true]])
            );
            expect(flightObj.shouldDisplay).toBeTruthy(); //selected
         });

         it("when a flight is filtered out, then later filtered in", function() {
            expect(flightObj.shouldDisplay).toBeTruthy(); //visible by default
            const dummyMap = new Map<string, boolean>([["zzzz", true]]);
            flightStore.updateFilteredFlights(dummyMap);
            flightStore.updateIsFiltered(true);
            expect(flightObj.shouldDisplay).toBeFalsy(); //filtered out

            const dummyMap2 = new Map<string, boolean>([]);
            flightStore.updateFilteredFlights(dummyMap2);
            flightStore.updateIsFiltered(false);
            expect(flightObj.shouldDisplay).toBeTruthy(); //selected
         });
      });

      it("gets the demographic data", function() {
         expect(flightObj.demographics).toEqual({
            destination: "",
            origin: "",
            model: ""
         });
         flightStore.addDemographics(FlightADemographic);
         expect(flightObj.demographics).toEqual(FlightADemographic.body);
      });
   });

   describe("determines the correct positions", function() {
      it("by deriving all positions", function() {
         flightStore.addOrUpdateFlight(FlightAPosition2);
         expect(flightObj.allPositions).toEqual([
            FlightAPosition1.body,
            FlightAPosition2.body
         ]);
      });

      it("by computing latest Position", function() {
         expect<FlightPosition>(
            flightObj.latestPosition as FlightPosition
         ).toEqual(FlightAPosition1.body);
         flightStore.addOrUpdateFlight(FlightAPosition2);
         expect<FlightPosition>(
            flightObj.latestPosition as FlightPosition
         ).toEqual(FlightAPosition2.body);
      });

      it("by updating the computed position", function() {
         flightStore.addOrUpdateFlight(FlightAPosition2);
         expect<FlightPosition>(
            flightObj.latestPosition as FlightPosition
         ).toEqual(FlightAPosition2.body);
      });

      it("by computing the correct Cartesian Position", function() {
         expect<Cartesian3>(flightObj.cartesianPosition as Cartesian3).toEqual(
            Cartesian3.fromDegrees(
               FlightAPosition1.body.longitude,
               FlightAPosition1.body.latitude,
               FlightAPosition1.body.altitude
            )
         );
         flightStore.addOrUpdateFlight(FlightAPosition2);
         expect<Cartesian3>(flightObj.cartesianPosition as Cartesian3).toEqual(
            Cartesian3.fromDegrees(
               FlightAPosition2.body.longitude,
               FlightAPosition2.body.latitude,
               FlightAPosition2.body.altitude
            )
         );
      });
   });

   describe("handles Point", function() {
      // xit("computes the correct Point display condition", function () {
      //     expect<boolean>(flightObj.shouldPointDisplay).toBeTruthy()
      // });

      describe("basics", function() {
         it("by creating the Point Primitive", function() {
            expect(flightObj.point).not.toBeNull();
            const point = flightObj.point;
            if (point) {
               expect(point.position).toEqual(
                  Cartesian3.fromDegrees(
                     FlightAPosition1.body.longitude,
                     FlightAPosition1.body.latitude,
                     FlightAPosition1.body.altitude
                  )
               );
               expect(
                  flightObj.geoCollection.points.contains(point)
               ).toBeTruthy();
            } else {
               fail("point not defined");
            }
         });

         it("by updating the Point Primitive location reactively inside the same geohash boundary", function() {
            expect(flightObj.point).not.toBeNull();
            const point = flightObj.point;
            if (point) {
               flightStore.addOrUpdateFlight(FlightAPosition2);
               expect<Cartesian3>(point.position).toEqual(
                  Cartesian3.fromDegrees(
                     FlightAPosition2.body.longitude,
                     FlightAPosition2.body.latitude,
                     FlightAPosition2.body.altitude
                  )
               );
            } else {
               fail("point not defined");
            }
         });

         it("by updating the Point Primitive location manually", function() {
            expect(flightObj.point).not.toBeNull();
            const point = flightObj.point;
            if (point) {
               expect(point.position).toEqual(
                  Cartesian3.fromDegrees(
                     FlightAPosition1.body.longitude,
                     FlightAPosition1.body.latitude,
                     FlightAPosition1.body.altitude
                  )
               );
               point.position = Cartesian3.fromDegrees(
                  FlightAPosition2.body.longitude,
                  FlightAPosition2.body.latitude,
                  FlightAPosition2.body.altitude
               );
               expect(point.position).toEqual(
                  Cartesian3.fromDegrees(
                     FlightAPosition2.body.longitude,
                     FlightAPosition2.body.latitude,
                     FlightAPosition2.body.altitude
                  )
               );
            } else {
               fail("point not defined");
            }
         });
      });

      describe("filtering and visibility", function() {
         it("by creating visible new Points when they match the filter", function() {
            flightStore.updateFilteredFlights(
               new Map<string, boolean>([[FlightBPosition1.icao, true]])
            );
            flightStore.addOrUpdateFlight(FlightBPosition1);
            const flightB = flightStore.flights.get(
               FlightBPosition1.icao
            ) as FlightObj;
            const point = flightB.point as PointPrimitive;
            expect(point.show).toEqual(true);
         });

         it("by creating non-visible new Points when they do not match the filter", function() {
            flightStore.updateFilteredFlights(
               new Map<string, boolean>([["zzz", true]])
            );
            flightStore.updateIsFiltered(true);
            flightStore.addOrUpdateFlight(FlightBPosition1);
            const flightB = flightStore.flights.get(
               FlightBPosition1.icao
            ) as FlightObj;
            const point = flightB.point as PointPrimitive;
            expect(point.show).toEqual(false);
         });

         it("by toggling visibility when visibility criteria changes", function() {
            const point = flightObj.point as PointPrimitive;
            expect(point.show).toBeTruthy();
            flightStore.updateFilteredFlights(
               new Map<string, boolean>([["zzz", true]])
            );
            flightStore.updateIsFiltered(true);
            expect(point.show).toBeFalsy();
            flightStore.updateFilteredFlights(new Map<string, boolean>([]));
            flightStore.updateIsFiltered(false);
            expect(point.show).toBeTruthy();
         });
      });

      describe("display options", function() {
         it("by using an updated the color", function() {
            const point = flightObj.point as PointPrimitive;
            expect(
               point.color.equals(Color.fromCssColorString("#3399ff"))
            ).toBeTruthy();
            const newColor = "#ff5b43";
            flightStore.updatePointDisplay({ color: newColor });
            expect(
               point.color.equals(Color.fromCssColorString(newColor))
            ).toBeTruthy();
         });

         it("by deriving the correct color when the point is selected", () => {
            expect(flightObj.pointDisplayOptions).toEqual(
               flightStore.pointDisplayOptions
            );
            flightStore.updateSelectedFlight(
               newICAOMap([FlightAPosition1.icao])
            );
            expect(flightObj.pointDisplayOptions).toEqual(
               flightStore.selectedPointDisplayOptions
            );
         });

         it("by using the correct color when the point is selected", () => {
            const point = flightObj.point as PointPrimitive;
            expect(
               point.color.equals(flightStore.pointDisplayOptions.cesiumColor)
            ).toBeTruthy();
            flightStore.updateSelectedFlight(
               newICAOMap([FlightAPosition1.icao])
            );
            expect(
               point.color.equals(
                  flightStore.selectedPointDisplayOptions.cesiumColor
               )
            ).toBeTruthy();
         });
      });
   });

   describe("handles Trails", function() {
      describe("basics", () => {
         it("by creating the trail", function() {
            flightStore.addOrUpdateFlight(FlightAPosition2);
            flightStore.updateDetailedFlights(
               new Map([[FlightAPosition2.body.geohash, true]])
            );
            const expectedPositions = [
               Cartesian3.fromDegrees(
                  FlightAPosition1.body.longitude,
                  FlightAPosition1.body.latitude,
                  FlightAPosition1.body.altitude
               ),
               Cartesian3.fromDegrees(
                  FlightAPosition2.body.longitude,
                  FlightAPosition2.body.latitude,
                  FlightAPosition2.body.altitude
               )
            ];
            if (flightObj.trail) {
               expect(flightObj.trail.positions).toEqual(expectedPositions);
               expect(
                  flightObj.geoCollection.lines.contains(flightObj.trail)
               ).toBeTruthy();
            } else {
               fail("trail not defined");
            }
         });

         it("by destroying the trail", function() {
            expect(flightObj.trail).toBeNull();
            flightStore.addOrUpdateFlight(FlightAPosition2);
            flightStore.updateDetailedFlights(
               new Map([[FlightAPosition2.body.geohash, true]])
            );
            expect(flightObj.trail).not.toBeNull();
            flightStore.updateDetailedFlights(new Map());
            expect(flightObj.trail).toBeNull();
         });
      });

      describe("visibility", function() {
         it("when the flight is selected", function() {
            expect<boolean>(flightObj.shouldTrailDisplay).toBeFalsy();
            flightStore.addOrUpdateFlight(FlightAPosition2);
            flightStore.updateSelectedFlight(
               newICAOMap([FlightAPosition1.icao])
            );
            expect<boolean>(flightObj.shouldTrailDisplay).toBeTruthy();
         });

         it("when LOD increases", function() {
            expect<boolean>(flightObj.shouldTrailDisplay).toBeFalsy();
            flightStore.addOrUpdateFlight(FlightAPosition2);
            flightStore.updateDetailedFlights(
               new Map([[FlightAPosition2.body.geohash, true]])
            );
            expect<boolean>(flightObj.shouldTrailDisplay).toBeTruthy();
         });

         it("when LOD increases but the flight is also filtered out", function() {
            expect<boolean>(flightObj.shouldTrailDisplay).toBeFalsy();
            flightStore.addOrUpdateFlight(FlightAPosition2);
            flightStore.updateDetailedFlights(
               new Map([[FlightAPosition1.body.geohash, true]])
            );
            flightStore.updateFilteredFlights(newICAOMap(["zzz"]));
            flightStore.updateIsFiltered(true);
            expect<boolean>(flightObj.shouldTrailDisplay).toBeFalsy();
         });

         it("when the flight is filtered out but also selected", function() {
            expect<boolean>(flightObj.shouldTrailDisplay).toBeFalsy();
            flightStore.addOrUpdateFlight(FlightAPosition2);
            flightStore.updateFilteredFlights(newICAOMap(["zzz"]));
            flightStore.updateSelectedFlight(
               newICAOMap([FlightAPosition1.icao])
            );
            expect<boolean>(flightObj.shouldTrailDisplay).toBeTruthy();
         });
      });

      describe("display options", function() {
         it("updates the trail color", function() {
            flightStore.addOrUpdateFlight(FlightAPosition2);
            flightStore.updateDetailedFlights(
               new Map([[FlightAPosition2.body.geohash, true]])
            );
            const trail = flightObj.trail as Polyline;

            const currentColor = get(trail, "material.uniforms.color") as Color;
            const expectedColor = Color.fromCssColorString(
               TrailDisplayOptionDefaults.color
            );
            expect(expectedColor.equals(currentColor)).toBeTruthy();

            const newColor = "#ff5b43";
            flightStore.updateTrailDisplay({ color: newColor });
            const newCurrentColor = get(
               trail,
               "material.uniforms.color"
            ) as Color;
            const newExpectedColor = Color.fromCssColorString(newColor);
            expect(newExpectedColor.equals(newCurrentColor)).toBeTruthy();
         });
      });
   });

   describe("handles Label", function() {
      describe("basics", () => {
         it("by computing the correct label text when demographics are available", function() {
            flightStore.addDemographics(FlightADemographic);
            expect(flightObj.labelText.length).toBeGreaterThan(0);
            expect(flightObj.labelText.indexOf("Tokyo")).toBeGreaterThan(0);
         });

         it("creates, displays, and destroys the Label", function() {
            flightStore.updateDetailedFlights(
               new Map([[FlightAPosition1.body.geohash, true]])
            );
            const flight = flightStore.flights.get(FlightAPosition1.icao);
            if (flight && flight.label) {
               expect(
                  flight.geoCollection.labels.contains(flight.label)
               ).toBeTruthy();
               expect(flight.label.position).toEqual(
                  Cartesian3.fromDegrees(
                     FlightAPosition1.body.longitude,
                     FlightAPosition1.body.latitude,
                     FlightAPosition1.body.altitude
                  )
               );
               flightStore.addDemographics(FlightADemographic);
               flightStore.updateDetailedFlights(new Map());
               expect(
                  flight.geoCollection.labels.contains(flight.label)
               ).toBeFalsy();
               expect(flight.label).toBeNull();
            } else {
               fail("flight or label not defined");
            }
         });

         it("updates the Label position", function() {
            flightStore.updateDetailedFlights(
               new Map([[FlightAPosition1.body.geohash, true]])
            );
            flightStore.addOrUpdateFlight(FlightAPosition2);
            flightStore.updateDetailedFlights(
               new Map([[FlightAPosition2.body.geohash, true]])
            );
            const flight = flightStore.flights.get(FlightAPosition1.icao);
            if (flight && flight.label) {
               expect(flight.label.position).toEqual(
                  Cartesian3.fromDegrees(
                     FlightAPosition2.body.longitude,
                     FlightAPosition2.body.latitude,
                     FlightAPosition2.body.altitude
                  )
               );
            } else {
               fail("flight or label not defined");
            }
         });
      });

      describe("visibility", () => {
         it("computes the correct Label display condition", function() {
            expect<boolean>(flightObj.shouldLabelDisplay).toBeFalsy();
            flightStore.updateDetailedFlights(
               new Map([[FlightAPosition1.body.geohash, true]])
            );
            expect<boolean>(flightObj.shouldLabelDisplay).toBeTruthy(); //detail selected
            flightStore.updateFilteredFlights(newICAOMap(["zzz"]));
            flightStore.updateIsFiltered(true);
            expect<boolean>(flightObj.shouldLabelDisplay).toBeFalsy(); // filtered out
         });
      });

      describe("display options", function() {
         it("updates the label color", function() {
            flightStore.updateDetailedFlights(
               new Map([[FlightAPosition1.body.geohash, true]])
            );
            const label = flightObj.label as Label;
            expect(
               label.fillColor.equals(
                  Color.fromCssColorString(LabelDisplayOptionDefaults.color)
               )
            ).toBeTruthy();
            const newColor = "#ff5b43";
            flightStore.updateLabelDisplay({ color: newColor });
            expect(
               label.fillColor.equals(Color.fromCssColorString(newColor))
            ).toBeTruthy();
         });
      });
   });
});
