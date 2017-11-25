import React from 'react';
import CesiumGlobe from '../cesium_components/CesiumGlobe';
import axios from 'axios';

class App extends React.Component {
  constructor() {
    super();
    this.loadPlaneData = this.loadPlaneData.bind(this);
    this.state = { planes: [] };
  }

  componentDidMount() {
    this.loadPlaneData();
  }

  loadPlaneData() {
    console.log('start request');
    axios.get('/data')
      .then(({ data }) => {
        this.setState({ planes: data });
        console.log(data);
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
