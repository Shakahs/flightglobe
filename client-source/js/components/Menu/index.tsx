import * as React from 'react';
import {FontAwesomeIcon as FontAwesome} from "@fortawesome/react-fontawesome";
import { Nav, NavItem, Dropdown, DropdownItem, DropdownToggle, DropdownMenu, NavLink } from 'reactstrap';
import {size} from "lodash-es";
import {icon} from "@fortawesome/fontawesome-svg-core";

interface MenuProps {
    flightTableToggle: ()=>void
}

interface MenuState {
    dropdownOpen:boolean
}

class Menu extends React.Component<MenuProps, MenuState> {
    constructor(props) {
        super(props);
        this.state = {
            dropdownOpen: false
        }
        this.toggle = this.toggle.bind(this);
    }

    toggle() {
        this.setState({
            dropdownOpen: !this.state.dropdownOpen
        });
    }

    render() {
        return (
            <div
            className={'fixed-top p-2'}
            >
                <button
                    onClick={this.props.flightTableToggle}
                >
                    <FontAwesome icon='cog' size='lg'/>
                </button>
                <button
                    onClick={this.props.flightTableToggle}
                >
                    <FontAwesome icon='filter' size='lg'/>
                </button>
            </div>
        );
    }
}

export default Menu;
