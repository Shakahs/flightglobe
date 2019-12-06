import FlightTable from "./FlightTable/FlightTable";
import * as React from "react";
import Menu from "./Menu/Menu";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { faFilter } from "@fortawesome/free-solid-svg-icons/faFilter";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import { faGlobeAmericas } from "@fortawesome/free-solid-svg-icons/faGlobeAmericas";
import classnames from "classnames";
import { hot } from "react-hot-loader/root";
import { Globe } from "../globe/globe";
import { DemographicsManager } from "../ds-implementation/DemographicsManager";
import "antd/dist/antd.css";
import { DisplayPreferences } from "../ds-implementation/DisplayPreferences";
import Settings2 from "./Settings2/Settings2";
import { message } from "antd";

library.add(faCog, faFilter, faCircleNotch, faGlobeAmericas);

interface AppProps {
   demographicsManager: DemographicsManager;
   displayPreferences: DisplayPreferences;
   globe: Globe;
}

interface AppState {
   showFlightTable: boolean;
   showSettings: boolean;
}

class App extends React.Component<AppProps, AppState> {
   constructor(props) {
      super(props);
      this.state = {
         showFlightTable: false,
         showSettings: false
      };

      this.toggleShowFlightTable = this.toggleShowFlightTable.bind(this);
      this.toggleShowSettings = this.toggleShowSettings.bind(this);
   }

   toggleShowFlightTable() {
      this.setState({
         showFlightTable: !this.state.showFlightTable,
         showSettings: false
      });
   }

   toggleShowSettings() {
      this.setState({
         showSettings: !this.state.showSettings,
         showFlightTable: false
      });
   }

   componentDidMount() {
      const hide = message.loading("Loading globe imagery...", 0);
      const timer = setInterval(() => {
         //@ts-ignore tilesLoaded is not in the TS definition
         if (this.props.globe.viewer.scene.globe.tilesLoaded) {
            clearInterval(timer);
            hide();
         }
      }, 250);
   }

   render() {
      return (
         <React.Fragment>
            <Settings2
               visible={this.state.showSettings}
               toggleVisible={this.toggleShowSettings}
               displayPreferences={this.props.displayPreferences}
               globe={this.props.globe}
            />
            <Menu
               toggleShowFlightTable={this.toggleShowFlightTable}
               toggleShowInfoModal={this.toggleShowSettings}
               globe={this.props.globe}
            />
            <div
               className={classnames("px-2", "pb-2", "flightTable", {
                  "fixed-bottom": this.state.showFlightTable
               })}
            >
               <FlightTable dManager={this.props.demographicsManager} />
            </div>
         </React.Fragment>
      );
   }
}

export default hot(App);
