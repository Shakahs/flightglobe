import * as React from "react";
import { Card, Checkbox, Drawer, Collapse } from "antd";
import { DisplayPreferences } from "../../ds-implementation/DisplayPreferences";
import { observer } from "mobx-react";
import Swatch from "../Swatch/Swatch";

interface Settings2Props {
   visible: boolean;
   toggleVisible: () => void;
   displayPreferences: DisplayPreferences;
}

@observer
class Settings2 extends React.Component<Settings2Props> {
   render() {
      const { Panel } = Collapse;

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
            <Collapse>
               <Panel header={"Points"} key={1}>
                  <div>
                     Fill Color:
                     <Swatch
                        color={
                           this.props.displayPreferences.pointDisplayOptions
                              .color
                        }
                        onChange={(color: string) =>
                           this.props.displayPreferences.updatePointDisplay({
                              color
                           })
                        }
                     />
                  </div>
                  <div>
                     Outline Color:{" "}
                     <Swatch
                        color={
                           this.props.displayPreferences.pointDisplayOptions
                              .outlineColor
                        }
                        onChange={(color: string) =>
                           this.props.displayPreferences.updatePointDisplay({
                              outlineColor: color
                           })
                        }
                     />
                  </div>
               </Panel>
            </Collapse>
         </Drawer>
      );
   }
}

export default Settings2;
