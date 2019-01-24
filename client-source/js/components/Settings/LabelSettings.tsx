import * as React from 'react';
import {FlightStore} from "../../flightStore";
import Swatch from "../Swatch/Swatch";
import {observer} from "mobx-react";
import Container from "reactstrap/lib/Container";
import Col from "reactstrap/lib/Col";
import Row from "reactstrap/lib/Row";
import SizeSelector from "./SizeSelector";

interface LabelSettingsProps {
    flightstore: FlightStore
}

const LabelSettings: React.SFC<LabelSettingsProps> = observer((props) => (
    <Container>
        <Row>
            <Col >
                <Row>
                    Label Size:
                </Row>
                <Row>
                    Label Color:
                </Row>
            </Col>
            <Col>
                <Row>
                    <SizeSelector
                        currentValue={props.flightstore.labelDisplayOptions.size}
                        possibleValues={[8,10,12,14,16]}
                        onChange={(size: number)=>props.flightstore.updateLabelDisplay({size})}
                    />
                </Row>
                <Row>
                    <Swatch
                        color={props.flightstore.labelDisplayOptions.color}
                        onChange={(color:string)=>props.flightstore.updateLabelDisplay({color})}
                    />
                </Row>
            </Col>
        </Row>
    </Container>
));

export default LabelSettings;
