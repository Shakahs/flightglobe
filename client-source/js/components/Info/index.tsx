import * as React from 'react';
import Modal from "reactstrap/lib/Modal";
import ModalHeader from "reactstrap/lib/ModalHeader";

interface InfoProps {
    showModal: boolean,
    toggle: ()=>void
}

interface InfoState {
}

class Info extends React.Component<InfoProps, InfoState> {
    constructor(props) {
        super(props);
        this.state = {
        };
    }


    render() {
        return (
            <Modal
                isOpen={this.props.showModal}
                toggle={this.props.toggle}
            >
                <ModalHeader>
                    FlightGlobe
                </ModalHeader>
            </Modal>
        );
    }
}

export default Info;
