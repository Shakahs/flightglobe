import { createAction } from 'redux-actions';
import { forOwn } from 'lodash-es';
import { Map, List, fromJS, is } from 'immutable';

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


  const newState = state.withMutations(mut => {
    forOwn(payload, (entry, key) => {
      const pData = Map({ ...entry });
      mut.setIn(['flights', key, 'modified'], timeNow);
      if (!state.hasIn(['flights', key, 'positions'])) {
        mut.setIn(['flights', key, 'added'], timeNow);
        mut.setIn(['flights', key, 'positions'], List([pData]));
      } else {
        mut.updateIn(['flights', key, 'positions'], list => {
          if (!is(pData, list.get(-1))) {
            return list.push(pData).takeLast(5);
          }
          return list;
        });
      }
    });
    return mut;
  });

  return newState;
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
