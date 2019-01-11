import * as React from 'react';
import {FlightStore} from "../../flightStore";
import {observer} from "mobx-react";
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";

interface StatsProps {
    flightstore: FlightStore
}

const Stats: React.SFC<StatsProps> = observer((props) => {
    const visibleFlights = (props.flightstore.detailedFlights.size>0) ?
        props.flightstore.detailedFlights.size :
        props.flightstore.flightData.size;

    return (
        <div>
            <Row>
                <Col>
                    Total Flights:
                </Col>
                <Col>
                    {props.flightstore.flightData.size}
                </Col>
            </Row>
            <Row>
                <Col>
                    Visible Flights:
                </Col>
                <Col>
                    {visibleFlights}
                </Col>
            </Row>
        </div>
    )
});

export default Stats;
