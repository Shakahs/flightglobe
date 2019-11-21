import * as React from "react";
import { observer } from "mobx-react";
import { AgGridReact } from "ag-grid-react";
import {
   ColDef,
   FilterChangedEvent,
   SelectionChangedEvent
} from "ag-grid-community";
import { GridReadyEvent } from "ag-grid-community/dist/lib/events";
import { FlightDemographics } from "../../../../lib/types";
import { DemographicsManager } from "../../ds-implementation/DemographicsManager";
import { Lambda } from "mobx";
import { each } from "lodash";
import { Icao } from "../../types";

interface FlightTableProps {
   dManager: DemographicsManager;
}

interface FlightTableState {
   columnDefs: ColDef[];
   disposer?: Lambda;
}

@observer
class FlightTable extends React.Component<FlightTableProps, FlightTableState> {
   constructor(props) {
      super(props);
      this.state = {
         columnDefs: [
            { field: "icao" },
            {
               field: "origin",
               headerName: "Origin",
               filter: "agTextColumnFilter",
               sortable: true
            },
            {
               field: "destination",
               headerName: "Destination",
               filter: "agTextColumnFilter",
               sortable: true
            },
            {
               field: "model",
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
      const initialLoad: FlightDemographics[] = [];
      this.props.dManager.demographicsMap.forEach((v, k) => {
         initialLoad.push({ icao: k, ...v });
      });
      if (event.api) {
         event.api.setRowData(initialLoad);
      }

      // continuous updates
      const disposer = this.props.dManager.demographicsMap.observe((change) => {
         if (change.type === "add" && event.api) {
            event.api.batchUpdateRowData({
               add: [{ icao: change.name, ...change.newValue }]
            });
         } else if (change.type === "update" && event.api) {
            event.api.batchUpdateRowData({
               update: [{ icao: change.name, ...change.newValue }]
            });
         }
      });

      this.setState({ disposer });
   }

   componentWillUnmount(): void {
      if (this.state.disposer) {
         this.state.disposer();
      }
   }

   filterChanged(data: FilterChangedEvent) {
      const resultMap = new Map<string, boolean>();
      if (data.api) {
         data.api.forEachNodeAfterFilter((node) => {
            resultMap.set(node.data.icao, true);
         });
         this.props.dManager.updateIsFiltered(data.api.isAnyFilterPresent());
      }
      this.props.dManager.updateFilteredFlights(resultMap);
   }

   selectionChanged(event: SelectionChangedEvent) {
      if (event.api) {
         const selectedRows = event.api.getSelectedRows() as FlightDemographics[];
         const newSelectedMap = new Map<string, boolean>();
         each(selectedRows, (r) => {
            newSelectedMap.set(r.icao as Icao, true);
         });
         this.props.dManager.updateSelectedFlights(newSelectedMap);
      }
   }

   render() {
      return (
         <React.Fragment>
            <div>
               <span>
                  Total Flights: {this.props.dManager.demographicsMap.size}
               </span>
               {this.props.dManager.isFiltered && (
                  <span>
                     {" "}
                     - Filtered Flights:{" "}
                     {this.props.dManager.filteredFlights.size}
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
               />
            </div>
         </React.Fragment>
      );
   }
}

export default FlightTable;
