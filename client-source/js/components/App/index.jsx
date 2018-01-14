import React from 'react';
import axios from 'axios';
import CesiumGlobe from '../cesium_components/CesiumGlobe';

class App extends React.Component {
  constructor() {
    super();
    this.state = { planes: {} };
  }

  componentDidMount() {
    console.log('websocket attempt');
    const sock = new WebSocket('ws://localhost:8080/sub/global');
    sock.addEventListener('open', () => {
      console.log('websocket open');
    });
    sock.addEventListener('message', (event) => {
      console.log('websocket message received');
      this.setState({ planes: JSON.parse(event.data) });
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
