import * as React from 'react';
import {FlightStore} from "../../flightStore";
import {observer} from "mobx-react";
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";
const dateParse = require('date-fns/parse');
const dateDistance = require('date-fns/distance_in_words_strict');

interface StatsProps {
    flightstore: FlightStore
}

const Stats: React.SFC<StatsProps> = observer((props) => {
    const visibleFlights = (props.flightstore.detailedFlights.size>0) ?
        props.flightstore.detailedFlights.size :
        props.flightstore.flightData.size;

    const updateDistance = dateDistance(
        dateParse(props.flightstore.newestPositionTimestamp*1000),
        new Date()
    );

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
            <Row>
                <Col>
                    Last Update
                </Col>
                <Col>
                    {updateDistance}
                </Col>
            </Row>
        </div>
    )
});

export default Stats;
