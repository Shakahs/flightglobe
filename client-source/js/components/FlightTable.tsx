import * as React from 'react';
import {FlightDemographics, Icao} from "../types";
import { observer } from "mobx-react"
import {ObservableMap} from "mobx";
import {sampleSize} from "lodash-es";
import {AgGridReact, AgGridColumn, AgGridColumnProps} from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham-dark.css';
import {GridApi,AgGridEvent,FilterChangedEvent} from 'ag-grid-community'
import {FlightStore} from "../flightStore";
import {GridReadyEvent} from "ag-grid-community/dist/lib/events";

interface FlightTableProps {
    store: FlightStore
}

interface FlightTableState {
    columnDefs: any,
}

@observer
class FlightTable extends React.Component<FlightTableProps,FlightTableState> {
    constructor(props){
        super(props);
        this.state = {
            columnDefs: [
                {field:"icao"},
                {field:"demographic.origin", headerName: "Origin"},
                {field:"demographic.destination", headerName: "Destination"},
                {field:"demographic.model", headerName: "Plane"}
            ]
        };
        this.gridReady=this.gridReady.bind(this)
        this.filterChanged=this.filterChanged.bind(this)
    }

    gridReady(event: GridReadyEvent){
            this.props.store.flightData.observe((change)=>{
                if(change.type==='add' && event.api){
                    event.api.batchUpdateRowData({
                        add:[change.newValue]
                    })
                }
                else if(change.type==='update' && event.api){
                    event.api.batchUpdateRowData({
                        update:[change.newValue]
                    })
                }
            })
    }

    filterChanged(data:FilterChangedEvent){
        const resultMap = new Map<string,boolean>();
        if(data.api){
            data.api.forEachNodeAfterFilter((node)=>{
              resultMap.set(node.data.icao,true)
            })
        }
        this.props.store.updateFilteredFlights(resultMap);
    }

    render() {
        return(
            <div>
                <div
                    className="ag-theme-balham-dark"
                    style={{
                        height: '500px',
                        width: '600px'
                    }}
                >
                    <AgGridReact
                        columnDefs={this.state.columnDefs}
                        getRowNodeId={(data)=>{return data.icao}}
                        onFilterChanged={this.filterChanged}
                        onGridReady={this.gridReady}
                        enableSorting
                        enableFilter
                    >
                    </AgGridReact>
                </div>

            </div>
        )
    }
}

export default FlightTable