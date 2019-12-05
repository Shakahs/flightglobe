import * as React from "react";
import { Select, Checkbox, Drawer, Collapse } from "antd";
import { DisplayPreferences } from "../../ds-implementation/DisplayPreferences";
import { observer } from "mobx-react";
import Swatch from "../Swatch/Swatch";
import { Globe } from "../../globe/globe";
import { GlobeImageryTypes } from "../../types";

interface Settings2Props {
   visible: boolean;
   toggleVisible: () => void;
   displayPreferences: DisplayPreferences;
   globe: Globe;
}

@observer
class Settings2 extends React.Component<Settings2Props> {
   render() {
      const { Panel } = Collapse;
      const { Option } = Select;

      return (
         <Drawer
            visible={this.props.visible}
            closable
            title={"Settings"}
            placement={"left"}
            onClose={this.props.toggleVisible}
         >
            <Collapse defaultActiveKey={0}>
               <Panel header={"General"} key={0}>
                  Imagery:{" "}
                  <Select
                     value={this.props.globe.selectedImagery}
                     onChange={(newVal) => {
                        this.props.globe.selectImagery(newVal);
                     }}
                  >
                     <Option value={GlobeImageryTypes.topographic}>
                        Topographic
                     </Option>
                     <Option value={GlobeImageryTypes.satellite}>
                        Satellite
                     </Option>
                  </Select>
               </Panel>
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
               <Panel key={2} header={"Tracks"}>
                  <Checkbox
                     checked={this.props.displayPreferences.showNearbyTrails}
                     onChange={
                        this.props.displayPreferences.toggleShowNearbyTrails
                     }
                  >
                     Show Tracks for Aircraft in view
                  </Checkbox>
               </Panel>
            </Collapse>
         </Drawer>
      );
   }
}

export default Settings2;
