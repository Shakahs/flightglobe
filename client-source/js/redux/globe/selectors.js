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
      });
  }
);

export const getPlaneRaw = (state, props) => {
  return state.getIn(['globe', 'flights', props.icao]);
};

export const getPlane = createCachedSelector(
  [getPlaneRaw],
  (thisPlane) => {
    return thisPlane;
  }
)((state, props) => props.icao);
