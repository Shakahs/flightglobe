import React from 'react';
import CesiumRoot from '../cesium_components/CesiumRoot';


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
        <CesiumRoot
          onLeftClick={ this.handleLeftClick }
        />
      </div>
    );
  }
}

export default App;
