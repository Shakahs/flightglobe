import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import 'cesium/Source/Widgets/widgets.css';
import rootReducer from './redux/rootReducer';
import sagas from './redux/rootSaga';

// import buildModuleUrl from 'cesium/Source/Core/buildModuleUrl';
import App from './components/App';

// Create store
const sagaMiddleware = createSagaMiddleware();
const middleware = [sagaMiddleware];
const store = createStore(
  rootReducer,
  undefined, composeWithDevTools(applyMiddleware(...middleware))
);
sagaMiddleware.run(sagas);

// Render it to DOM
ReactDOM.render(
  <Provider store={ store }>
    <App />
  </Provider>,
  document.getElementById('root')
);
