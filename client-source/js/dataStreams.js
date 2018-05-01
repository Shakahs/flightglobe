import { Observable } from 'rxjs';
import { globe } from './api';

const loc = window.location;

const populate$ = Observable.fromPromise(globe.retrieveGlobalSnapshot());

const wsStream$ = new Observable((observer) => {
  const socket = new WebSocket(`ws://${ loc.host }/sub/globalStream`);
  socket.addEventListener('message', (e) => observer.next(e));
  return () => socket.close();
});

const wsStreamShare$ = wsStream$
  .map((event) => JSON.parse(event.data))
  .share();

const dataStream$ = wsStreamShare$
  .merge(populate$)

export default dataStream$;
