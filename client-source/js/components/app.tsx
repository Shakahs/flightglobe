import FlightTable from "./FlightTable";
import * as React from "react";
import { Container, Row, Col } from 'reactstrap';
import Menu from "./Menu";
import { library } from '@fortawesome/fontawesome-svg-core'
import {faCog} from '@fortawesome/free-solid-svg-icons/faCog'
import {faFilter} from '@fortawesome/free-solid-svg-icons/faFilter'
import {faCircleNotch} from '@fortawesome/free-solid-svg-icons/faCircleNotch'
import {FlightStore} from "../flightStore";
import LoadingScreen from "./LoadingScreen";
import Info from "./Info";
import classnames from 'classnames';

library.add(faCog,faFilter,faCircleNotch);

interface AppProps {
    flightStore: FlightStore
    viewer: Cesium.Viewer
}

interface AppState {
    showFlightTable: boolean
    showInfoModal: boolean
}

class App extends React.Component<AppProps, AppState> {
    constructor(props) {
        super(props);
        this.state = {
            showFlightTable: false,
            showInfoModal: false
        };

        this.toggleShowFlightTable = this.toggleShowFlightTable.bind(this);
        this.toggleShowInfoModal = this.toggleShowInfoModal.bind(this);
    }

    toggleShowFlightTable(){
        this.setState({
            showFlightTable: !this.state.showFlightTable,
        })
    }

    toggleShowInfoModal(){
        this.setState({
            showInfoModal: !this.state.showInfoModal,
        })
    }

    render() {
        return (
            <React.Fragment>
                <LoadingScreen viewer={this.props.viewer}/>
                <Info
                    showModal={this.state.showInfoModal}
                    toggle={this.toggleShowInfoModal}
                    flightStore={this.props.flightStore}
                />
                <Menu
                    toggleShowFlightTable={this.toggleShowFlightTable}
                    toggleShowInfoModal={this.toggleShowInfoModal}
                />
                <div
                    className={classnames('px-2', 'pb-2', 'flightTable', {'fixed-bottom':this.state.showFlightTable})}
                >
                    <FlightTable store={this.props.flightStore}/>
                </div>
            </React.Fragment>
        );
    }
}

export default App;