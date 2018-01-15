import { createAction } from 'redux-actions';
import { assign } from 'lodash-es';

export const RECEIVE_FLIGHTS = 'globe/RECEIVE_FLIGHTS';
export const receiveFlights = createAction(RECEIVE_FLIGHTS);

const initialState = {
  flights: [],
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_FLIGHTS:
      return assign({}, state, { flights: action.payload });
    default:
      return state;
  }
}
