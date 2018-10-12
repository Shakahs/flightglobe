import { Observable } from 'rxjs';
import {webSocket} from "rxjs/webSocket";
import {map, share} from 'rxjs/operators'
import { globe } from './api';
import {FlightPosition, FlightPositionMap} from "./types";

const loc = window.location;

// const wsStream$ = new Observable((observer) => {
//   const socket = new WebSocket();
//   socket.addEventListener('message', (e:MessageEvent) => observer.next(e.data));
//   return () => socket.close();
// });

let wsStream$ = webSocket<string>(`ws://${ loc.host }/sub`);

const wsStreamShare$ = wsStream$
    .pipe(map<string, FlightPositionMap>((data) => JSON.parse(data)));
    // .pipe(share());
  // .share();

export default wsStreamShare$;
