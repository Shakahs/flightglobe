import * as React from "react";
import { observer } from "mobx-react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, FilterChangedEvent } from "ag-grid-community";
import { FlightStore } from "../../ws-implementation/flightStore";
import {
   GridReadyEvent,
   SelectionChangedEvent
} from "ag-grid-community/dist/lib/events";
import { FlightRecord } from "../../../../lib/types";

interface FlightTableProps {
   store: FlightStore;
}

interface FlightTableState {
   columnDefs: ColDef[];
}

@observer
class FlightTable extends React.Component<FlightTableProps, FlightTableState> {
   constructor(props) {
      super(props);
      this.state = {
         columnDefs: [
            { field: "icao" },
            {
               field: "demographic.origin",
               headerName: "Origin",
               filter: "agTextColumnFilter",
               sortable: true
            },
            {
               field: "demographic.destination",
               headerName: "Destination",
               filter: "agTextColumnFilter",
               sortable: true
            },
            {
               field: "demographic.model",
               headerName: "Plane",
               filter: "agTextColumnFilter",
               sortable: true
            }
         ]
      };
      this.gridReady = this.gridReady.bind(this);
      this.filterChanged = this.filterChanged.bind(this);
      this.selectionChanged = this.selectionChanged.bind(this);
   }

   gridReady(event: GridReadyEvent) {
      //initial load
      const initialLoad: FlightRecord[] = [];
      this.props.store.flightData.forEach((f) => {
         initialLoad.push(f);
      });
      if (event.api) {
         event.api.setRowData(initialLoad);
      }

      //continuous updates
      const disposer = this.props.store.flightData.observe((change) => {
         if (change.type === "add" && event.api) {
            event.api.batchUpdateRowData({
               add: [change.newValue]
            });
         } else if (change.type === "update" && event.api) {
            event.api.batchUpdateRowData({
               update: [change.newValue]
            });
         }
      });
   }

   filterChanged(data: FilterChangedEvent) {
      const resultMap = new Map<string, boolean>();
      if (data.api) {
         data.api.forEachNodeAfterFilter((node) => {
            resultMap.set(node.data.icao, true);
         });
         this.props.store.updateIsFiltered(data.api.isAnyFilterPresent());
      }
      this.props.store.updateFilteredFlights(resultMap);
   }

   selectionChanged(event: SelectionChangedEvent) {
      if (event.api) {
         const selectedRows = event.api.getSelectedRows() as FlightRecord[];
         const newSelectedMap = new Map<string, boolean>();
         selectedRows.forEach((r) => {
            newSelectedMap.set(r.icao, true);
         });
         this.props.store.updateSelectedFlight(newSelectedMap);
      }
   }

   render() {
      return (
         <React.Fragment>
            <div>
               <span>Total Flights: {this.props.store.flightData.size}</span>
               {this.props.store.isFiltered && (
                  <span>
                     {" "}
                     - Filtered Flights: {this.props.store.filteredFlights.size}
                  </span>
               )}
            </div>
            <div className="ag-theme-balham-dark w-100 h-100">
               <AgGridReact
                  columnDefs={this.state.columnDefs}
                  getRowNodeId={(data) => {
                     return data.icao;
                  }}
                  onFilterChanged={this.filterChanged}
                  onGridReady={this.gridReady}
                  onSelectionChanged={this.selectionChanged}
                  rowSelection={"multiple"}
                  floatingFilter
               ></AgGridReact>
            </div>
         </React.Fragment>
      );
   }
}

export default FlightTable;
