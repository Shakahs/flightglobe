import * as React from 'react';
import {FlightStore} from "../../flightStore";
import NavLink from "reactstrap/lib/NavLink";
import NavItem from "reactstrap/lib/NavItem";
import Nav from "reactstrap/lib/Nav";
import TabContent from "reactstrap/lib/TabContent";
import TabPane from "reactstrap/lib/TabPane";
import PointSettings from "./PointSettings";
import classnames from "classnames";
import TrailSettings from "./TrailSettings";
import LabelSettings from "./LabelSettings";
import ModalBody from "reactstrap/lib/ModalBody";
import ModalHeader from "reactstrap/lib/ModalHeader";
import Modal from "reactstrap/lib/Modal";

interface SettingsProps {
    flightstore: FlightStore
    showModal: boolean,
    toggleModal: ()=>void,
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
            <Modal
                isOpen={this.props.showModal}
                toggle={this.props.toggleModal}
            >
                <ModalHeader toggle={this.props.toggleModal}>
                    Settings
                </ModalHeader>
                <ModalBody>
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
                    <TabPane tabId={'trails'}>
                        <TrailSettings flightstore={this.props.flightstore}/>
                    </TabPane>
                    <TabPane tabId={'labels'}>
                        <LabelSettings flightstore={this.props.flightstore}/>
                    </TabPane>
                </TabContent>
            </ModalBody>
            </Modal>
        );
    }
}

export default Settings;
