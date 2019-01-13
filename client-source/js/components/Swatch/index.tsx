import * as React from 'react';
import PopoverBody from "reactstrap/lib/PopoverBody";
import Popover from "reactstrap/lib/Popover";
import {FlightStore} from "../../flightStore";
import PopoverHeader from "reactstrap/lib/PopoverHeader";
import Button from "reactstrap/lib/Button";
import {GithubPicker} from "react-color";
import { Manager, Reference, Popper } from 'react-popper';
import {observer} from "mobx-react";

interface SwatchProps {
    flightStore: FlightStore
}

interface SwatchState {
    pickerOpen: boolean
}

@observer
class Swatch extends React.Component<SwatchProps, SwatchState> {
    constructor(props) {
        super(props);
        this.state = {
            pickerOpen: false
        }
        this.toggle = this.toggle.bind(this);

    }

    toggle() {
        this.setState({
            pickerOpen: !this.state.pickerOpen
        });
    }

    render() {
        return (
            <React.Fragment>
                <div className={'swatch'} >
                    <div className={'swatch-inner'} style={{backgroundColor:this.props.flightStore.pointDisplayOptions.color}}/>
                </div>
            </React.Fragment>
        );
    }
}

export default Swatch;

