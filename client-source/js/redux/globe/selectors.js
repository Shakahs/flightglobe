import { createSelector } from 'reselect';
import { flatMapDeep } from 'lodash-es';

export const getGlobalFeed = state => state.globe.flights;

export const getPositions = createSelector(
  [getGlobalFeed],
  (allFlights) => {
    return flatMapDeep(allFlights);
  }
);
