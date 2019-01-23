import {
    FlightDemographics,
    FlightPosition,
    FlightRecord,
    Icao, LabelDisplayOptions,
    PointDisplayOptions,
    TrailDisplayOptions
} from "./types";
import {Cartesian3, Label, PointPrimitive, Polyline} from "cesium";
import {autorun, computed, IReactionDisposer} from "mobx";
import {convertPositionToCartesian} from "./utility";
import {FlightStore} from "./flightStore";
import * as Cesium from "cesium";
import {GeoCollection} from "./geoCollection";

const labelOffset = new Cesium.Cartesian2(10, 20);

export class FlightObj {
    flightStore: FlightStore;
    flightRecord: FlightRecord;
    icao: Icao;
    geoCollection: GeoCollection;
    point: null | PointPrimitive = null;
    trail: null | Polyline = null;
    label: null | Label = null;
    disposers: Array<IReactionDisposer>;

    constructor(flightStore, flightRecord, icao: Icao, geo) {
        this.flightStore = flightStore;
        this.flightRecord = flightRecord;
        this.icao = icao;
        this.geoCollection = geo;

        const pointVisibilityUpdater = autorun(() => {
            const shouldDisplay = this.shouldDisplay;
            if (this.point && shouldDisplay) {
                this.point.show = true
            } else if (this.point && !shouldDisplay) {
                this.point.show = false
            }
        }, {name: 'pointVisibilityUpdater'});

        const pointUpdater = autorun(() => {
            const newPosition = this.cartesianPosition;
            const shouldDisplay = this.shouldDisplay;
            const displayOptions = this.flightStore.pointDisplayOptions;
            if (newPosition) {
                this.renderPoint(newPosition, shouldDisplay, displayOptions)
            }
        }, {name: 'pointUpdater'});

        const trailUpdater = autorun(() => {
            const shouldTrailDisplay = this.shouldTrailDisplay;
            const positions = this.trailPositions;
            const displayOptions = this.flightStore.trailDisplayOptions;
            if (shouldTrailDisplay) {
                this.renderTrail(positions, displayOptions)
            } else {
                this.destroyTrail()
            }
        }, {name: 'trailUpdater'});

        const labelUpdater = autorun(() => {
            const shouldLabelDisplay = this.shouldLabelDisplay;
            const labelText = this.labelText;
            const newPosition = this.cartesianPosition;
            const displayOptions = this.flightStore.labelDisplayOptions;
            if (shouldLabelDisplay && newPosition) {
                this.renderLabel(newPosition, labelText, displayOptions)
            } else {
                this.destroyLabel()
            }
        }, {name: 'labelUpdater'});

        this.disposers = [pointVisibilityUpdater, pointUpdater, trailUpdater, labelUpdater];
    }

    // essential data

    @computed get isSelected(): boolean {
        return this.flightStore.selectedFlights.has(this.icao);
    }

    @computed get isDetailSelected(): boolean {
        if (this.latestPosition) { //selected by LOD
            return this.flightStore.detailedFlights.has(this.latestPosition.geohash);
        }
        return false
    }

    @computed get isFilterSelected(): boolean {
        return this.flightStore.filteredFlights.has(this.icao); // filter active, check the filter result
    }

    @computed get shouldDisplay(): boolean {
        if(this.isSelected){ return true; }
        if(this.flightStore.isFiltered){
            return this.isSelected || this.isFilterSelected
        }
        return true
    }

    @computed get shouldDisplayDetailed(): boolean {
        if (this.isSelected) {
            return true
        } //selected by user
        return this.isDetailSelected
    }

    @computed get demographics(): FlightDemographics | null {
        const flightRecord = this.flightStore.flightData.get(this.icao);
        if (flightRecord && flightRecord.demographic) {
            return flightRecord.demographic;
        }
        return null;
    }

    // position

    @computed get allPositions(): FlightPosition[] {
        const flightRecord = this.flightStore.flightData.get(this.icao);
        if (flightRecord) {
            return flightRecord.positions;
        }
        return []
    }

    @computed get latestPosition(): FlightPosition | null {
        if (this.allPositions.length > 0) {
            return this.allPositions[this.allPositions.length - 1];
        }
        return null
    }

    @computed get cartesianPosition(): Cartesian3 | null {
        if (this.latestPosition) {
            return convertPositionToCartesian(this.latestPosition)
        }
        return null
    }

    // points

    renderPoint(pos: Cartesian3, visibility: boolean, displayOptions: PointDisplayOptions) {
        if (this.point) {
            this.point.position = pos;
        } else {
            this.point = this.geoCollection.points.add({
                position: pos,
                id: this.icao,
                show: visibility,
            });
        }
        this.point.color = Cesium.Color.fromCssColorString(displayOptions.color);
        this.point.pixelSize = displayOptions.size;
        this.point.outlineColor = Cesium.Color.fromCssColorString(displayOptions.outlineColor);
        this.point.outlineWidth = displayOptions.outlineSize;
    }

    destroyPoint() {
        if (this.point) {
            this.geoCollection.points.remove(this.point);
            this.point = null;
        }
    }

    // trails

    @computed get shouldTrailDisplay(): boolean {
        return this.allPositions.length >= 1 && this.shouldDisplayDetailed && this.shouldDisplay
    }

    renderTrail(positions: Cartesian3[], displayOptions:TrailDisplayOptions) {
        if(this.trail){
            this.trail.positions = positions
        } else {
            const polyLine = {
                positions: positions,
                id: this.icao
            };
            this.trail = this.geoCollection.lines.add(polyLine);
        }
        if(this.trail){
            this.trail.width = displayOptions.size;
            this.trail.material =  new Cesium.Material({
                fabric : {
                    type : 'Color',
                    uniforms : {
                        color : Cesium.Color.fromCssColorString(displayOptions.color)
                    }
                }
            });
        }
    }

    destroyTrail() {
        if (this.trail) {
            this.geoCollection.lines.remove(this.trail);
            this.trail = null;
        }
    }

    //depending on the length of the available position history, and this points selection status
    //return the whole position history or the last 5 positions
    @computed get trailPositions(): Cartesian3[] {
        let subPosList: FlightPosition[] = [];
        if (this.isSelected || this.allPositions.length <= 5) {
            subPosList = this.allPositions;
        } else {
            subPosList = this.allPositions.slice(this.allPositions.length - 5)
        }
        return subPosList.map((p) => convertPositionToCartesian(p))
    }

    // labels

    @computed get shouldLabelDisplay() {
        return this.shouldDisplayDetailed;
    }

    @computed get labelText(): string {
        if (this.demographics) {
            return `${this.icao}\n${this.demographics.origin}\n${this.demographics.destination}`
        }

        return '';
    }

    renderLabel(pos: Cartesian3, labelText: string, displayOptions: LabelDisplayOptions) {
        if (this.label) {
            this.label.position = pos;
            this.label.text = labelText;
        } else {
            this.label = this.geoCollection.labels.add({
                position: pos,
                text: labelText,
                pixelOffset: labelOffset,
                outlineWidth: 2.0
            });
        }
        this.label.fillColor = Cesium.Color.fromCssColorString(displayOptions.color)
        this.label.font = `${displayOptions.size}px sans-serif`
    }

    destroyLabel() {
        if (this.label) {
            this.geoCollection.labels.remove(this.label);
            this.label = null;
        }
    }

    // cleanup

    destroy() {
        this.destroyPoint();
        this.destroyLabel();
        //call each disposer function to destroy the MobX reaction, otherwise this is a memory leak
        this.disposers.forEach((d) => {
            d()
        })
    }
}