import { createSelector } from 'reselect';

export const getFlights = state => state.getIn(['globe', 'flights']);
export const getLastValid = state => state.getIn(['globe', 'lastValid']);

export const getPositions = createSelector(
  [getFlights, getLastValid],
  (allFlights, lastValid) => {
    return allFlights.filter((v) => {
      return v.get('added') < lastValid;
    });
  }
);

// export const getPositions = createSelector(
//   [getGlobalFeed],
//   (allFlights) => {
//     return flatMapDeep(allFlights);
//   }
// );
