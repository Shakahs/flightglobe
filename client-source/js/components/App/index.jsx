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
        <div style={ { position: 'fixed', top: 0 } }>
          <div style={ { color: 'white', fontSize: 40 } }>
            Text Over the Globezzz
          </div>
          <button style={ { fontSize: 40 } } onClick={ this.handleFlyToClicked }>
            Jump Camera Location
          </button>
        </div>

      </div>
    );
  }
}

export default App;
