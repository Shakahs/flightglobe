import { Observable } from 'rxjs';
import { globe } from './api';
import {FlightPosition, FlightPositionMap} from "./types";

const loc = window.location;

// const wsStream$ = new Observable((observer) => {
//   const socket = new WebSocket();
//   socket.addEventListener('message', (e:MessageEvent) => observer.next(e.data));
//   return () => socket.close();
// });

let wsStream$ = Observable.webSocket<string>(`ws://${ loc.host }/sub`);

const wsStreamShare$ = wsStream$
  .map<string, FlightPositionMap>((data) => JSON.parse(data))
  .share();

export default wsStreamShare$;
