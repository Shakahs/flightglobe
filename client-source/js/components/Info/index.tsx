import * as React from 'react';
import Modal from "reactstrap/lib/Modal";
import ModalHeader from "reactstrap/lib/ModalHeader";
import ModalBody from "reactstrap/lib/ModalBody";
import TabContent from "reactstrap/lib/TabContent";
import TabPane from "reactstrap/lib/TabPane";
import NavLink from "reactstrap/lib/NavLink";
import NavItem from "reactstrap/lib/NavItem";
import Nav from "reactstrap/lib/Nav";
import classnames from 'classnames';
import {FlightStore} from "../../flightStore";
import Stats from "../Stats";
import Settings from "../Settings";

interface InfoProps {
    showModal: boolean,
    toggle: ()=>void,
    flightStore: FlightStore
}

interface InfoState {
    activeTab: string
}

class Info extends React.Component<InfoProps, InfoState> {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: 'settings'
        };
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
                toggle={this.props.toggle}
            >
                <ModalHeader toggle={this.props.toggle}>
                    FlightGlobe
                </ModalHeader>
                <ModalBody>
                    <Nav tabs justified pills>
                        <NavItem>
                            <NavLink
                                href="#"
                                className={classnames({ active: this.state.activeTab === 'settings' })}
                                onClick={() => { this.toggle('settings'); }}
                            >
                                Settings
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                href="#"
                                className={classnames({ active: this.state.activeTab === 'stats' })}
                                onClick={() => { this.toggle('stats'); }}
                            >
                                Stats
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                href="#"
                                className={classnames({ active: this.state.activeTab === 'about' })}
                                onClick={() => { this.toggle('about'); }}
                            >
                                About
                            </NavLink>
                        </NavItem>
                    </Nav>
                    <TabContent activeTab={this.state.activeTab}>
                        <TabPane tabId={'settings'}>
                            <Settings flightstore={this.props.flightStore}/>
                        </TabPane>
                        <TabPane tabId={'stats'}>
                            <Stats flightstore={this.props.flightStore}/>
                        </TabPane>
                        <TabPane tabId={'about'}>
                            about
                        </TabPane>
                    </TabContent>
                </ModalBody>
            </Modal>
        );
    }
}

export default Info;
