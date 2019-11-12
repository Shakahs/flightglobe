import * as React from "react";
import { UncontrolledDropdown } from "reactstrap";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import { FlightStore } from "../../ws-implementation/flightStore";
import DropdownToggle from "reactstrap/lib/DropdownToggle";

interface SizeSelectorProps {
   currentValue: number;
   possibleValues: number[];
   onChange: (newSize: number) => void;
}

const SizeSelector: React.SFC<SizeSelectorProps> = (props) => (
   <UncontrolledDropdown size={"sm"}>
      <DropdownToggle caret>{props.currentValue}</DropdownToggle>
      <DropdownMenu>
         {props.possibleValues.map((i) => (
            <DropdownItem
               key={i}
               onClick={() => {
                  props.onChange(i);
               }}
            >
               {i}
            </DropdownItem>
         ))}
      </DropdownMenu>
   </UncontrolledDropdown>
);

export default SizeSelector;
