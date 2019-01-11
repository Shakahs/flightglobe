import FlightTable from "./FlightTable";
import * as React from "react";
import { Container, Row, Col } from 'reactstrap';
import Menu from "./Menu";
import { library } from '@fortawesome/fontawesome-svg-core'
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars'
import {faFilter} from '@fortawesome/free-solid-svg-icons/faFilter'
import {faCircleNotch} from '@fortawesome/free-solid-svg-icons/faCircleNotch'
import {FlightStore} from "../flightStore";
import LoadingScreen from "./LoadingScreen";

library.add(faBars,faFilter,faCircleNotch);

interface AppProps {
    flightStore: FlightStore
    viewer: Cesium.Viewer
}

interface AppState {
    showFlightTable: boolean
}

class App extends React.Component<AppProps, AppState> {
    constructor(props) {
        super(props);
        this.state = {
            showFlightTable: false
        }
        this.toggleShowFlightTable = this.toggleShowFlightTable.bind(this)
    }

    toggleShowFlightTable(){
        this.setState({
            showFlightTable: !this.state.showFlightTable,
        })
    }

    render() {
        return (
            <React.Fragment>
                <LoadingScreen viewer={this.props.viewer}/>
                <Menu
                    flightTableToggle={this.toggleShowFlightTable}
                />
                {this.state.showFlightTable &&
                <FlightTable store={this.props.flightStore}/>
                }
            </React.Fragment>
        );
    }
}

export default App;