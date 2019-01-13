import * as React from 'react';
import {FlightStore} from "../../flightStore";
import Swatch from "../Swatch";
import GithubPicker from "react-color/lib/components/github/Github";
import {observer} from "mobx-react";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import {UncontrolledDropdown} from "reactstrap";

interface PointSettingsProps {
    flightstore: FlightStore
}

const PointSettings: React.SFC<PointSettingsProps> = observer((props) => (
    <div>
        <UncontrolledDropdown>
            <DropdownToggle caret>
                Size: {props.flightstore.pointDisplayOptions.size}
            </DropdownToggle>
            <DropdownMenu>
                {[1,2,3,4,5,6,7,8,9,0].map((i)=>(
                    <DropdownItem key={i} onClick={()=>{
                        props.flightstore.updatePointDisplay({color: props.flightstore.pointDisplayOptions.color, size: i})
                    }} >{i}</DropdownItem>
                ))}
            </DropdownMenu>
        </UncontrolledDropdown>
        <Swatch flightStore={props.flightstore}/>
        <GithubPicker
            color={props.flightstore.pointDisplayOptions.color}
            onChangeComplete={(color)=>{
                props.flightstore.updatePointDisplay({color:color.hex, size: props.flightstore.pointDisplayOptions.size})
            }}
        />
    </div>
));

export default PointSettings;
