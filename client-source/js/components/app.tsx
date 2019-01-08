import FlightTable from "./FlightTable";
import * as React from "react";

const App = (props) => (
    <FlightTable
        store={props.flightStore}
    />
);

export default App;