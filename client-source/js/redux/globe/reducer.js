import { createAction } from 'redux-actions';
import { mapValues } from 'lodash-es';
import { Map, fromJS } from 'immutable';

export const RECEIVE_FLIGHTS = 'globe/RECEIVE_FLIGHTS';
export const receiveFlights = createAction(RECEIVE_FLIGHTS);

export const RETRIEVE_HISTORY = 'globe/RETRIEVE_HISTORY';
export const retrieveHistory = createAction(RETRIEVE_HISTORY);

const initialState = fromJS({ flights: {} });

const mergeFlights = (state, payload) => {
  const timeNow = new Date().getTime();
  const timePayload = mapValues(payload, (entry) => { return { modified: timeNow, ...entry }; });
  return state.mergeDeepIn(['flights'], timePayload);
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_FLIGHTS:
      return mergeFlights(state, action.payload);
    default:
      return state;
  }
}
