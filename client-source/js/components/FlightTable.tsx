import * as React from 'react';
import {FlightDemographics, FlightRecord, Icao} from "../types";
import { observer } from "mobx-react"
import {AgGridReact, AgGridColumn, AgGridColumnProps} from 'ag-grid-react';
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
                {
                    field:"demographic.origin",
                    headerName: "Origin",
                    filter:'agTextColumnFilter'
                },
                {
                    field:"demographic.destination",
                    headerName: "Destination",
                    filter:'agTextColumnFilter'
                },
                {
                    field:"demographic.model",
                    headerName: "Plane",
                    filter:'agTextColumnFilter'
                }
            ]
        };
        this.gridReady=this.gridReady.bind(this)
        this.filterChanged=this.filterChanged.bind(this)
    }

    gridReady(event: GridReadyEvent){
            //initial load
            const initialLoad: FlightRecord[] = [];
            this.props.store.flightData.forEach((f)=>{
                initialLoad.push(f)
            });
            if(event.api){
                event.api.setRowData(initialLoad)
            }

            //continuous updates
            const disposer = this.props.store.flightData.observe((change)=>{
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
                <div
                    className="ag-theme-balham-dark w-100 h-100"
                >
                    <AgGridReact
                        columnDefs={this.state.columnDefs}
                        getRowNodeId={(data)=>{return data.icao}}
                        onFilterChanged={this.filterChanged}
                        onGridReady={this.gridReady}
                        enableSorting
                        enableFilter
                        rowSelection={'multiple'}
                        floatingFilter
                    >
                    </AgGridReact>
                </div>
        )
    }
}

export default FlightTable