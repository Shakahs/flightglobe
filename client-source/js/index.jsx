import React from 'react';
import ReactDOM from 'react-dom';
import 'cesium/Source/Widgets/widgets.css';

// import buildModuleUrl from 'cesium/Source/Core/buildModuleUrl';
import App from './components/App';

// buildModuleUrl.setBaseUrl('./cesium');

// Render it to DOM
ReactDOM.render(
  <App />,
  document.getElementById('root')
);
