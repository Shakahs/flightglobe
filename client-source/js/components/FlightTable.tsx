import * as React from 'react';
import {FlightDemographics, Icao} from "../types";
import { observer } from "mobx-react"
import {ObservableMap} from "mobx";
import {sampleSize} from "lodash-es";
import {AgGridReact, AgGridColumn, AgGridColumnProps} from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham-dark.css';
import {GridApi,AgGridEvent,FilterChangedEvent} from 'ag-grid-community'
import {FlightStore} from "../store";

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
                {field:"origin"},
                {field:"destination"},
                {field:"model"}
            ]
        };
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
                        rowData={this.props.store.displayedDemographics}
                        getRowNodeId={(data)=>{return data.icao}}
                        onFilterChanged={(data:FilterChangedEvent)=>{
                            const resultMap = new Map<string,boolean>();
                            if(data.api){
                                data.api.forEachNodeAfterFilter((node)=>{
                                    resultMap.set(node.data.icao,true)
                                })
                            }
                            this.props.store.updateFilteredFlights(resultMap);
                        }}
                        deltaRowDataMode
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