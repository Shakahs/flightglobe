import { eventChannel, delay } from 'redux-saga';
import { call, put, take } from 'redux-saga/effects';
import { actions as globeActions } from './index';
import { globe } from '../../api';


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

export function* watchRetrieveHistory() {
  while (true) {
    try {
      const { payload } = yield take(globeActions.RETRIEVE_HISTORY);
      const data = yield call(globe.retrieveFlightHistory, payload);
      console.log(data);
      yield put(globeActions.receiveFlights(data));
    } catch (err) {
      console.log(err);
    }
  }
}

export function* updateValidTime() {
  while (true) {
    yield delay(1000 * 30);
    yield put(globeActions.updateTime(new Date().getTime()));
  }
}
