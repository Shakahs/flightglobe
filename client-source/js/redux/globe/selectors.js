import { createSelector } from 'reselect';

export const getThisState = state => state.get('globe');

export const getPositions = createSelector(
  [getThisState],
  (thisState) => {
    return thisState.get('flights');
  }
);

// export const getPositions = createSelector(
//   [getGlobalFeed],
//   (allFlights) => {
//     return flatMapDeep(allFlights);
//   }
// );
