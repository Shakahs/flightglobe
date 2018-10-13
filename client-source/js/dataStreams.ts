import { webSocket} from "rxjs/webSocket";

import { globe } from './api';
import {FlightPositionMap} from "./types";

const loc = window.location;

const socket$ =  webSocket<FlightPositionMap>(`ws://${ loc.host }/sub`);

export default socket$;
