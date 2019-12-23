import * as React from "react";
import { Button } from "antd";
import { observer } from "mobx-react";
import { Globe } from "../../globe/globe";
import { Icon } from "antd";

interface MenuProps {
   toggleShowFlightTable: () => void;
   toggleShowInfoModal: () => void;
   globe: Globe;
}

interface MenuState {
   dropdownOpen: boolean;
}

@observer
class Menu extends React.Component<MenuProps, MenuState> {
   constructor(props) {
      super(props);
      this.state = {
         dropdownOpen: false
      };
      this.toggle = this.toggle.bind(this);
   }

   toggle() {
      this.setState({
         dropdownOpen: !this.state.dropdownOpen
      });
   }

   render() {
      return (
         <div
            className={"fixed-top p-2"}
            style={{
               zIndex: 10
            }}
         >
            <Button className={"mr-1"} onClick={this.props.toggleShowInfoModal}>
               <Icon type="setting" style={{ fontSize: "20px" }} />
            </Button>
            <Button
               className={"mr-1"}
               onClick={this.props.toggleShowFlightTable}
            >
               <Icon type="filter" style={{ fontSize: "20px" }} />
            </Button>
         </div>
      );
   }
}

export default Menu;
