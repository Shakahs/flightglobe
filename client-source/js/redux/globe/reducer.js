import { createAction } from 'redux-actions';
import { forOwn, values } from 'lodash-es';
import { Map, List, fromJS, is } from 'immutable';
import Dexie from 'dexie';

export const RECEIVE_FLIGHTS = 'globe/RECEIVE_FLIGHTS';
export const receiveFlights = createAction(RECEIVE_FLIGHTS);

export const RETRIEVE_HISTORY = 'globe/RETRIEVE_HISTORY';
export const retrieveHistory = createAction(RETRIEVE_HISTORY);

export const UPDATE_TIME = 'globe/UPDATE_TIME';
export const updateTime = createAction(UPDATE_TIME);

export const KICKOFF = 'globe/KICKOFF';
export const kickOff = createAction(KICKOFF);

const initialState = fromJS({ flights: {}, lastValid: new Date().getTime() + 30000 });

const db = new Dexie('flightglobe');
db.version(1).stores({
  positions: '&icao',
});

const rxdbmerge = async (payload) => {
  const startTime = new Date().getTime();
  const newPayload = values(payload);
  // console.log('merge start');

  // try {
  //   await db.transaction('rw', db.positions, async () => {
  //     const work = [];
  //     forOwn(payload, async (entry) => {
  //       const existing = await db.positions.get(entry.icao);
  //       if (existing) {
  //         work.push(db.positions.update(entry.icao, entry));
  //       } else {
  //         work.push(db.positions.put(entry));
  //       }
  //     });
  //     await Promise.all(work);
  //   });
  // } catch (e) {
  //   console.log(e);
  // }

  // try {
  //   await db.transaction('rw', db.positions, async () => {
  //     const work = [];
  //     forOwn(payload, async (entry) => {
  //       work.push(db.positions.put(entry));
  //     });
  //     await Promise.all(work);
  //   });
  // } catch (e) {
  //   console.log(e);
  // }

  try {
    await db.positions.bulkPut(newPayload);
  } catch (e) {
    console.log(e);
  }


  const timeDiff = new Date().getTime() - startTime; // in ms
  console.log(`merge took ${ timeDiff }ms`);
};

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
      rxdbmerge(action.payload);
      return state;
    case UPDATE_TIME:
      return state.set('lastValid', action.payload);
    default:
      return state;
  }
}
