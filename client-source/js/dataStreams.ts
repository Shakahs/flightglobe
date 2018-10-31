import { webSocket} from "rxjs/webSocket";
import { bufferTime } from 'rxjs/operators';
import { globe } from './api';
import {FlightPosition, Message} from "./types";

const loc = window.location;

export const socket$ =  webSocket<Message>(`ws://${ loc.host }/sub`);
export const buffered$ = socket$.pipe(bufferTime(1000))
