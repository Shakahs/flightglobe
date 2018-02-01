import { createSelector } from 'reselect';
import { map } from 'lodash-es';

export const getGlobalFeed = state => state.globe.flights;

export const getPositions = createSelector(
  [getGlobalFeed],
  (allFlights) => {
    return map(allFlights, (flight, icao) => (
      {
        icao,
        ...flight[0],
      }
    ));
  }
);
