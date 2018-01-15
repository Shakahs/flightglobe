import { fork, all } from 'redux-saga/effects';
import { map, merge } from 'lodash-es';
import { sagas as globeSagas } from './globe';

const allSagas = merge({}, globeSagas);

export default function* () {
  yield all(map(allSagas, fork));
}
