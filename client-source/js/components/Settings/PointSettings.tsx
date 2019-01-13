import * as React from 'react';
import {FlightStore} from "../../flightStore";
import Swatch from "../Swatch";
import GithubPicker from "react-color/lib/components/github/Github";
import {observer} from "mobx-react";

interface PointSettingsProps {
    flightstore: FlightStore

}

const PointSettings: React.SFC<PointSettingsProps> = observer((props) => (
    <div>
        <h5>Points:</h5>
        <Swatch flightStore={props.flightstore}/>
        <GithubPicker
            color={props.flightstore.pointDisplayOptions.color}
            onChangeComplete={(color)=>{
                props.flightstore.updatePointDisplay({color:color.hex})
            }}
        />
    </div>
));

export default PointSettings;
