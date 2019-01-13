import * as React from 'react';

interface SwatchProps {
    color: string
}

interface SwatchState {
    pickerOpen: boolean
}

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
                    <div className={'swatch-inner'} style={{backgroundColor:this.props.color}}/>
                </div>
            </React.Fragment>
        );
    }
}

export default Swatch;

