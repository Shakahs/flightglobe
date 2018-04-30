import { createSelector } from 'reselect';
import createCachedSelector from 're-reselect';

export const getFlights = state => state.getIn(['globe', 'flights']);
export const getLastValid = state => state.getIn(['globe', 'lastValid']);

export const getPositions = createSelector(
  [getFlights, getLastValid],
  (allFlights, lastValid) => {
    const targetTime = new Date().getTime() - 1100;
    return allFlights.filter((v) => {
      return v.get('added') < lastValid;
    })
      .filter((v) => {
        return v.get('modified') > targetTime;
      })
      .map(v => {
        return v.getIn(['positions', -1]);
      });
  }
);

export const getPlaneRaw = (state, icao) => {
  return state.getIn(['globe', 'flights', icao]);
};

export const getPlane = createCachedSelector(
  [getPlaneRaw],
  (thisPlane) => {
    return thisPlane;
  }
)((state, icao) => icao);
