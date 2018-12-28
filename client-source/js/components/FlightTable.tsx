import * as React from 'react';
import {FlightDemographics, Icao} from "../types";
import { observer } from "mobx-react"
import {ObservableMap} from "mobx";
import {sampleSize} from "lodash-es";
import {AgGridReact, AgGridColumn, AgGridColumnProps} from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';


interface FlightTableProps {
    demoData: any
}

interface FlightTableState {
    columnDefs: any
}


const FlightTable = observer(
    class FlightTableClass extends React.Component<FlightTableProps,FlightTableState> {

        constructor(){
            super();
            this.state = {
                columnDefs: [
                    {headername:"ICAO", field:"icao"},
                    {headername:"Origin", field:"origin"},
                    {headername:"Destination", field:"destination"}
                ]
            }
        }

        render() {
            return(
                <div>
                    Length: {this.props.demoData.displayedDemographics.length}
                    <div
                        className="ag-theme-balham"
                        style={{
                            height: '500px',
                            width: '600px' }}
                    >
                        <AgGridReact
                            //@ts-ignore
                            //@ts-ignore
                            enableSorting={true}
                            enableFilter={true}
                            //@ts-ignore
                            columnDefs={this.state.columnDefs}
                            deltaRowDateMode={true}
                            rowData={this.props.demoData.displayedDemographics}>
                            {/*rowData={sampleSize(demoData.displayedDemographics, 1000)}>*/}
                            {/*getRowNodeId={data=>data.icao}*/}
                            >
                        </AgGridReact>
                    </div>
                </div>
            )
        }
    }
)

// const FlightTable = observer(
//     ({demoData})=>(
//         <div>
//             Length: {demoData.displayedDemographics.length}
//             <div
//                 className="ag-theme-balham"
//                 style={{
//                     height: '500px',
//                     width: '600px' }}
//             >
//                 <AgGridReact
//                     //@ts-ignore
//                     //@ts-ignore
//                     enableSorting={true}
//                     enableFilter={true}
//                     //@ts-ignore
//                     columnDefs={[
//                         {headername:"ICAO", field:"icao"},
//                         {headername:"Origin", field:"origin"},
//                         {headername:"Destination", field:"destination"}
//                     ]}
//                     deltaRowDateMode={true}
//                     rowData={demoData.displayedDemographics}>
//                     {/*rowData={sampleSize(demoData.displayedDemographics, 1000)}>*/}
//                     getRowNodeId={data=>data.icao}
//                 >
//                 </AgGridReact>
//             </div>
//         </div>
//     )
// );

// interface FlightTableProps {
//     flightDemographics: FlightDemographics
// }
//
// const TodoView = observer(
//     class TodoView extends React.Component {
//         render() {
//             return <div>{this.props.todo.title}</div>
//         }
//     }
// )

export default FlightTable