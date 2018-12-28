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
    columnDefs: any,
    mockData: any,
}

@observer
class FlightTable extends React.Component<FlightTableProps,FlightTableState> {


    colDefs =  [
        {field:"icao"},
        {field:"origin"},
        {field:"destination"},
        {field:"model"}
    ];

    constructor(props){
        super(props);
        this.state = {
            columnDefs: [
                {field:"icao"},
                {field:"origin"},
                {field:"destination"},
                {field:"model"}
            ],
            mockData: []
        };

        this.getRowNodeId = this.getRowNodeId.bind(this);
    }

    getRowNodeId(data: FlightDemographics) {
        return data.icao;
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
                        // columnDefs={this.colDefs}
                        // enableSorting={true}
                        // enableFilter={true}
                        columnDefs={this.state.columnDefs}
                        //@ts-ignore
                        // deltaRowDateMode={true}
                        // rowData={this.props.demoData.displayedDemographics}>
                        rowData={[{icao:'abc',origin:'lax',destination:'nyc',model:'747'}]}>
                        {/*rowData={sampleSize(demoData.displayedDemographics, 1000)}>*/}
                        getRowNodeId={(data)=>{return data.icao}}
                        {/*getRowNodeId={this.getRowNodeId}*/}
                        >
                    </AgGridReact>
                </div>
            </div>
        )
    }
}

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