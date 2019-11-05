import * as React from "react";
import { FlightStore } from "../../flightStore";
import Swatch from "../Swatch/Swatch";
import { observer } from "mobx-react";
import Container from "reactstrap/lib/Container";
import Col from "reactstrap/lib/Col";
import Row from "reactstrap/lib/Row";
import SizeSelector from "./SizeSelector";

interface TrailSettingsProps {
   flightstore: FlightStore;
}

const TrailSettings: React.SFC<TrailSettingsProps> = observer((props) => (
   <Container>
      <Row>
         <Col>
            <Row>Trail Size:</Row>
            <Row>Trail Color:</Row>
         </Col>
         <Col>
            <Row>
               <SizeSelector
                  currentValue={props.flightstore.trailDisplayOptions.size}
                  possibleValues={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                  onChange={(size: number) =>
                     props.flightstore.updateTrailDisplay({ size })
                  }
               />
            </Row>
            <Row>
               <Swatch
                  color={props.flightstore.trailDisplayOptions.color}
                  onChange={(color: string) =>
                     props.flightstore.updateTrailDisplay({ color })
                  }
               />
            </Row>
         </Col>
      </Row>
   </Container>
));

export default TrailSettings;
