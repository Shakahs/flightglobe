import FlightTable from "./FlightTable/FlightTable";
import * as React from "react";
import { Container, Row, Col } from "reactstrap";
import Menu from "./Menu/Menu";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { faFilter } from "@fortawesome/free-solid-svg-icons/faFilter";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import { faGlobeAmericas } from "@fortawesome/free-solid-svg-icons/faGlobeAmericas";
import LoadingScreen from "./LoadingScreen/LoadingScreen";
import classnames from "classnames";
import { hot } from "react-hot-loader/root";
import Settings from "./Settings/Settings";
import { Globe } from "../globe/globe";
import { DemographicsManager } from "../ds-implementation/DemographicsManager";

library.add(faCog, faFilter, faCircleNotch, faGlobeAmericas);

interface AppProps {
   demographicsManager: DemographicsManager;
   globe: Globe;
}

interface AppState {
   showFlightTable: boolean;
   showInfoModal: boolean;
}

class App extends React.Component<AppProps, AppState> {
   constructor(props) {
      super(props);
      this.state = {
         showFlightTable: false,
         showInfoModal: false
      };

      this.toggleShowFlightTable = this.toggleShowFlightTable.bind(this);
      this.toggleSettingsModal = this.toggleSettingsModal.bind(this);
   }

   toggleShowFlightTable() {
      this.setState({
         showFlightTable: !this.state.showFlightTable
      });
   }

   toggleSettingsModal() {
      this.setState({
         showInfoModal: !this.state.showInfoModal
      });
   }

   render() {
      return (
         <React.Fragment>
            <LoadingScreen viewer={this.props.globe.viewer} />
            {/*<Settings*/}
            {/*   showModal={this.state.showInfoModal}*/}
            {/*   toggleModal={this.toggleSettingsModal}*/}
            {/*   flightstore={this.props.demographicsManager}*/}
            {/*/>*/}
            <Menu
               toggleShowFlightTable={this.toggleShowFlightTable}
               toggleShowInfoModal={this.toggleSettingsModal}
               globe={this.props.globe}
            />
            {this.state.showFlightTable && (
               <div
                  className={classnames("px-2", "pb-2", "flightTable", {
                     "fixed-bottom": this.state.showFlightTable
                  })}
               >
                  <FlightTable dManager={this.props.demographicsManager} />
               </div>
            )}
         </React.Fragment>
      );
   }
}

export default hot(App);
