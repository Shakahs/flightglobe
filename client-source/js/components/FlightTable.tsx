import * as React from 'react';
import {FlightDemographics, Icao} from "../types";
import { observer } from "mobx-react"
import {ObservableMap} from "mobx";
import {sampleSize} from "lodash-es";
import {AgGridReact, AgGridColumn, AgGridColumnProps} from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham-dark.css';


interface FlightTableProps {
    demoData: any
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
        }
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
                        rowData={this.props.demoData.displayedDemographics}
                        getRowNodeId={(data)=>{return data.icao}}
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