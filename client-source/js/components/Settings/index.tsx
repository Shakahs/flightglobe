import * as React from 'react';
import {FlightStore} from "../../flightStore";
import NavLink from "reactstrap/lib/NavLink";
import NavItem from "reactstrap/lib/NavItem";
import Nav from "reactstrap/lib/Nav";
import TabContent from "reactstrap/lib/TabContent";
import TabPane from "reactstrap/lib/TabPane";
import PointSettings from "./PointSettings";
import classnames from "classnames";

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
            activeTab:'points'
        }
        this.toggle = this.toggle.bind(this);
    }

    toggle(tab) {
        if (this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab
            });
        }
    }

    render() {
        return (
            <React.Fragment>
                <Nav tabs justified>
                    <NavItem>
                        <NavLink
                            href="#"
                            className={classnames({ active: this.state.activeTab === 'points' })}
                            onClick={() => { this.toggle('points'); }}
                        >
                            Points
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            href="#"
                            className={classnames({ active: this.state.activeTab === 'trails' })}
                            onClick={() => { this.toggle('trails'); }}
                        >
                            Trails
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            href="#"
                            className={classnames({ active: this.state.activeTab === 'labels' })}
                            onClick={() => { this.toggle('labels'); }}
                        >
                            Labels
                        </NavLink>
                    </NavItem>
                </Nav>
                <TabContent activeTab={this.state.activeTab}>
                    <TabPane tabId={'points'}>
                        <PointSettings flightstore={this.props.flightstore}/>
                    </TabPane>
                </TabContent>
            </React.Fragment>
        );
    }
}

export default Settings;
