import React from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import CesiumGlobe from '../cesium_components/CesiumGlobe';

class App extends React.Component {
  constructor() {
    super();
    this.state = { planes: {} };
  }

  componentDidMount() {
    const socket = io('http://localhost:5000', { path: '/updates' });
    socket.on('update', (planes) => {
      console.log('updating...');
      this.setState({ planes });
    });
  }

  // async loadPlaneData() {
  //   const planes = await
  //   this.setState({ planes });
  //   console.log(planes);
  // }

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
          planes={ this.state.planes }
          onLeftClick={ this.handleLeftClick }
        />
      </div>
    );
  }
}

export default App;
