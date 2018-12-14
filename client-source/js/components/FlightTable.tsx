import 'react-tabulator/lib/styles.css'; // required styles
import 'react-tabulator/lib/css/tabulator.min.css'; // theme
import { ReactTabulator } from 'react-tabulator';
import * as React from 'react';
import {FlightDemographics, Icao} from "../types";
import { observer } from "mobx-react"
import {ObservableMap} from "mobx";
import {sampleSize} from "lodash-es";

const FlightTable = observer(
    ({demoData})=>(
        <div>
            Length: {demoData.displayedDemographics.length}
            <ReactTabulator
                columns={[
                    {title:"Origin", field:"origin"},
                    {title:"Destination", field:"destination"}
                ]}
                // data={[]}
                data={sampleSize(demoData.displayedDemographics, 10)}
            />
        </div>
    )
);

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