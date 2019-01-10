import FlightTable from "./FlightTable";
import * as React from "react";
import { Container, Row, Col } from 'reactstrap';
import Menu from "./Menu";
import { library } from '@fortawesome/fontawesome-svg-core'
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars'
import {faFilter} from '@fortawesome/free-solid-svg-icons/faFilter'
import {FontAwesomeIcon as FontAwesome} from "@fortawesome/react-fontawesome";
import {FlightStore} from "../flightStore";

library.add(faBars,faFilter);

interface AppProps {
    flightStore: FlightStore
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