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
                <UncontrolledDropdown>
                    <DropdownToggle caret>
                        {props.flightstore.pointDisplayOptions.size}
                    </DropdownToggle>
                    <DropdownMenu>
                        {[1,2,3,4,5,6,7,8,9,0].map((i)=>(
                            <DropdownItem key={i} onClick={()=>{
                                props.flightstore.updatePointDisplay({size: i})
                            }} >{i}</DropdownItem>
                        ))}
                    </DropdownMenu>
                </UncontrolledDropdown>
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
                <UncontrolledDropdown>
                    <DropdownToggle caret>
                        {props.flightstore.pointDisplayOptions.outlineSize}
                    </DropdownToggle>
                    <DropdownMenu>
                        {[1,2,3,4,5,6,7,8,9,0].map((i)=>(
                            <DropdownItem key={i} onClick={()=>{
                                props.flightstore.updatePointDisplay({outlineSize: i})
                            }} >{i}</DropdownItem>
                        ))}
                    </DropdownMenu>
                </UncontrolledDropdown>
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
