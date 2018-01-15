import { combineReducers } from 'redux';
import { reducer as globeReducer } from './globe';

const reducers = {
  globe: globeReducer,
};

export default combineReducers(reducers);
