import * as React from "react";
import { Card, Checkbox, Drawer } from "antd";
import { DisplayPreferences } from "../../ds-implementation/DisplayPreferences";
import { observer } from "mobx-react";

interface Settings2Props {
   visible: boolean;
   toggleVisible: () => void;
   displayPreferences: DisplayPreferences;
}

@observer
class Settings2 extends React.Component<Settings2Props> {
   render() {
      return (
         <Drawer
            visible={this.props.visible}
            closable
            title={"Settings"}
            placement={"left"}
            onClose={this.props.toggleVisible}
         >
            <Card title={"Display Settings"}>
               <Checkbox
                  checked={this.props.displayPreferences.showNearbyTrails}
                  onChange={
                     this.props.displayPreferences.toggleShowNearbyTrails
                  }
               >
                  Show Tracks for Aircraft in view
               </Checkbox>
            </Card>
         </Drawer>
      );
   }
}

export default Settings2;
