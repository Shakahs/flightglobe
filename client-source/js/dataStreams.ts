import { webSocket} from "rxjs/webSocket";
import { bufferTime } from 'rxjs/operators';
import { globe } from './api';
import {FlightPosition} from "./types";

const loc = window.location;

const socket$ =  webSocket<FlightPosition>(`ws://${ loc.host }/sub`);
// const buffered$ = socket$.pipe(bufferTime(1000))
export default socket$;
