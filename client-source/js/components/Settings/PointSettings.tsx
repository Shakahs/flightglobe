import * as React from 'react';
import {FlightStore} from "../../flightStore";
import Swatch from "../Swatch";
import GithubPicker from "react-color/lib/components/github/Github";
import {observer} from "mobx-react";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import {UncontrolledDropdown} from "reactstrap";
import Container from "reactstrap/lib/Container";
import Col from "reactstrap/lib/Col";
import Row from "reactstrap/lib/Row";
import SizeSelector from "./SizeSelector";

interface PointSettingsProps {
    flightstore: FlightStore
}

const PointSettings: React.SFC<PointSettingsProps> = observer((props) => (
    <Container>
        <Row>
            <Col>
                Point Size:
            </Col>
            <Col>
                <SizeSelector
                    currentValue={props.flightstore.pointDisplayOptions.size}
                    possibleValues={[1,2,3,4,5,6,7,8,9,10]}
                    onChange={(size: number)=>props.flightstore.updatePointDisplay({size})}
                />
            </Col>
        </Row>
        <Row>
            <Col>
                Point Color
            </Col>
            <Col>
                <Swatch
                    color={props.flightstore.pointDisplayOptions.color}
                    onChange={(color:string)=>props.flightstore.updatePointDisplay({color})}
                />
            </Col>
        </Row>
        <Row>
            <Col>
                Outline Size:
            </Col>
            <Col>
                <SizeSelector
                    currentValue={props.flightstore.pointDisplayOptions.outlineSize}
                    possibleValues={[1,2,3,4,5,6,7,8,9,10]}
                    onChange={(size: number)=>props.flightstore.updatePointDisplay({outlineSize: size})}
                />
            </Col>
        </Row>
        <Row>
            <Col>
                Outline Color
            </Col>
            <Col>
                <Swatch
                    color={props.flightstore.pointDisplayOptions.outlineColor}
                    onChange={(color:string)=>props.flightstore.updatePointDisplay({outlineColor: color})}
                />
            </Col>
        </Row>

    </Container>
));

export default PointSettings;
