import { createAction } from 'redux-actions';
import { mapValues } from 'lodash-es';
import { Map, fromJS } from 'immutable';

export const RECEIVE_FLIGHTS = 'globe/RECEIVE_FLIGHTS';
export const receiveFlights = createAction(RECEIVE_FLIGHTS);

export const RETRIEVE_HISTORY = 'globe/RETRIEVE_HISTORY';
export const retrieveHistory = createAction(RETRIEVE_HISTORY);

export const UPDATE_TIME = 'globe/UPDATE_TIME';
export const updateTime = createAction(UPDATE_TIME);

export const KICKOFF = 'globe/KICKOFF';
export const kickOff = createAction(KICKOFF);

const initialState = fromJS({ flights: {}, lastValid: new Date().getTime() + 30000 });

const mergeFlights = (state, payload) => {
  const timeNow = new Date().getTime();
  const timePayload = mapValues(payload, (entry, key) => {
    if (!state.hasIn(['flights', key])) {
      return { modified: timeNow, added: timeNow, ...entry };
    }
    return { modified: timeNow, ...entry };
  });
  return state.mergeDeepIn(['flights'], timePayload);
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_FLIGHTS:
      return mergeFlights(state, action.payload);
    case UPDATE_TIME:
      return state.set('lastValid', action.payload);
    default:
      return state;
  }
}
