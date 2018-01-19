import { eventChannel } from 'redux-saga';
import { call, put, take } from 'redux-saga/effects';
import { actions as globeActions } from './index';

const loc = window.location;

function websocketInitChannel() {
  return eventChannel(emitter => {
    const ws = new WebSocket(`ws://${ loc.host }/sub/global`);
    ws.onmessage = e => {
      return emitter(globeActions.receiveFlights(JSON.parse(e.data)));
    };
    return () => {
      ws.close();
    };
  });
}

export function* streamGlobalFeed() {
  const channel = yield call(websocketInitChannel);
  while (true) {
    const action = yield take(channel);
    yield put(action);
  }
}
