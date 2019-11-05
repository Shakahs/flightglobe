import * as React from "react";
import { FlightStore } from "../../flightStore";
import Swatch from "../Swatch/Swatch";
import { observer } from "mobx-react";
import Container from "reactstrap/lib/Container";
import Col from "reactstrap/lib/Col";
import Row from "reactstrap/lib/Row";
import SizeSelector from "./SizeSelector";

interface PointSettingsProps {
   flightstore: FlightStore;
}

const PointSettings: React.SFC<PointSettingsProps> = observer((props) => (
   <Container>
      <Row>
         <Col>
            <Row>Point Size:</Row>
            <Row>Point Color:</Row>
            <Row>Outline Size:</Row>
            <Row>Outline Color:</Row>
         </Col>
         <Col>
            <Row>
               <SizeSelector
                  currentValue={props.flightstore.pointDisplayOptions.size}
                  possibleValues={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                  onChange={(size: number) =>
                     props.flightstore.updatePointDisplay({ size })
                  }
               />
            </Row>
            <Row>
               <Swatch
                  color={props.flightstore.pointDisplayOptions.color}
                  onChange={(color: string) =>
                     props.flightstore.updatePointDisplay({ color })
                  }
               />
            </Row>
            <Row>
               <SizeSelector
                  currentValue={
                     props.flightstore.pointDisplayOptions.outlineSize
                  }
                  possibleValues={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                  onChange={(size: number) =>
                     props.flightstore.updatePointDisplay({ outlineSize: size })
                  }
               />
            </Row>
            <Row>
               <Swatch
                  color={props.flightstore.pointDisplayOptions.outlineColor}
                  onChange={(color: string) =>
                     props.flightstore.updatePointDisplay({
                        outlineColor: color
                     })
                  }
               />
            </Row>
         </Col>
      </Row>
   </Container>
));

export default PointSettings;
