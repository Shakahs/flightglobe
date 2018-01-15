import React from 'react';
import CesiumGlobe from '../cesium_components/CesiumGlobe';

class App extends React.Component {
  render() {
    const containerStyle = {
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      position: 'fixed',
    };

    return (
      <div style={ containerStyle }>
        <CesiumGlobe
          onLeftClick={ this.handleLeftClick }
        />
      </div>
    );
  }
}

export default App;
