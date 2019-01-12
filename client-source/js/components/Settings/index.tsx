import * as React from 'react';
import {FlightStore} from "../../flightStore";
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";
import Button from "reactstrap/lib/Button";

interface SettingsProps {
    flightstore: FlightStore
}

const Settings: React.SFC<SettingsProps> = (props) => (
    <div>
        <Row>
            <Col>
                Toggle Color:
            </Col>
            <Col>
                <Button
                    onClick={()=>{
                        props.flightstore.updatePointDisplay({color:'#333300'})
                    }}
                >
                    Change
                </Button>
            </Col>
        </Row>
    </div>
);

export default Settings;
