import * as React from "react";
import { observer } from "mobx-react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, FilterChangedEvent } from "ag-grid-community";
import { FlightStore } from "../../ws-implementation/flightStore";
import {
   GridReadyEvent,
   SelectionChangedEvent
} from "ag-grid-community/dist/lib/events";
import { FlightDemographics, FlightRecord } from "../../../../lib/types";
import { DemographicsManager } from "../../ds-implementation/DemographicsManager";
import { Lambda } from "mobx";

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
      // this.filterChanged = this.filterChanged.bind(this);
      // this.selectionChanged = this.selectionChanged.bind(this);
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
         if ((change.type === "add" || change.type === "update") && event.api) {
            event.api.batchUpdateRowData({
               add: [{ icao: change.name, ...change.newValue }]
            });
         }
      });

      this.setState({ disposer });
   }

   // componentWillUnmount(): void {
   //    this.state.disposer?.();
   // }

   // filterChanged(data: FilterChangedEvent) {
   //    const resultMap = new Map<string, boolean>();
   //    if (data.api) {
   //       data.api.forEachNodeAfterFilter((node) => {
   //          resultMap.set(node.data.icao, true);
   //       });
   //       this.props.dManager.updateIsFiltered(
   //          data.api.isAnyFilterPresent()
   //       );
   //    }
   //    this.props.dManager.updateFilteredFlights(resultMap);
   // }
   //
   // selectionChanged(event: SelectionChangedEvent) {
   //    if (event.api) {
   //       const selectedRows = event.api.getSelectedRows() as FlightRecord[];
   //       const newSelectedMap = new Map<string, boolean>();
   //       selectedRows.forEach((r) => {
   //          newSelectedMap.set(r.icao, true);
   //       });
   //       this.props.dManager.updateSelectedFlight(newSelectedMap);
   //    }
   // }

   render() {
      return (
         <React.Fragment>
            <div>
               <span>
                  Total Flights: {this.props.dManager.demographicsMap.size}
               </span>
               {/*{this.props.dManager.isFiltered && (*/}
               {/*   <span>*/}
               {/*      {" "}*/}
               {/*      - Filtered Flights:{" "}*/}
               {/*      {this.props.dManager.filteredFlights.size}*/}
               {/*   </span>*/}
               {/*)}*/}
            </div>
            <div className="ag-theme-balham-dark w-100 h-100">
               <AgGridReact
                  columnDefs={this.state.columnDefs}
                  getRowNodeId={(data) => {
                     return data.icao;
                  }}
                  // onFilterChanged={this.filterChanged}
                  onGridReady={this.gridReady}
                  // onSelectionChanged={this.selectionChanged}
                  rowSelection={"multiple"}
                  floatingFilter
               />
            </div>
         </React.Fragment>
      );
   }
}

export default FlightTable;
