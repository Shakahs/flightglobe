import * as React from 'react';
import {FlightStore} from "../../flightStore";
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";
import Button from "reactstrap/lib/Button";
import { SliderPicker } from 'react-color';
import Badge from "reactstrap/lib/Badge";
import Swatch from "../Swatch";
import Container from "reactstrap/lib/Container";
import NavLink from "reactstrap/lib/NavLink";
import NavItem from "reactstrap/lib/NavItem";
import Nav from "reactstrap/lib/Nav";
import TabContent from "reactstrap/lib/TabContent";
import TabPane from "reactstrap/lib/TabPane";
import PointSettings from "./PointSettings";

interface SettingsProps {
    flightstore: FlightStore
}


interface SettingsState {
    activeTab: string
}

class Settings extends React.Component<SettingsProps, SettingsState> {
    constructor(props) {
        super(props);
        this.state = {
            activeTab:'point'
        }
    }

    render() {
        return (
            <Container>
                <Row>
                    <Col xs="auto">
                        <Nav vertical>
                            <NavItem>
                                <NavLink href="#">Points</NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink href="#">Trails</NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink href="#">Labels</NavLink>
                            </NavItem>
                        </Nav>
                    </Col>
                    <Col>
                        <TabContent activeTab={this.state.activeTab}>
                            <TabPane tabId={'point'}>
                                <PointSettings flightstore={this.props.flightstore}/>
                            </TabPane>
                        </TabContent>
                    </Col>
                </Row>
            </Container>
        );
    }
}

export default Settings;
