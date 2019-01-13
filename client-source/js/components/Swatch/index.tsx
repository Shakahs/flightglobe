import * as React from 'react';
import {FlightStore} from "../../flightStore";
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

