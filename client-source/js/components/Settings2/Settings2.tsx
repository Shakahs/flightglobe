import * as React from "react";
import {
   Select,
   Checkbox,
   Drawer,
   Collapse,
   InputNumber,
   Card,
   Slider
} from "antd";
import { DisplayPreferences } from "../../ds-implementation/DisplayPreferences";
import { observer } from "mobx-react";
import Swatch from "../Swatch/Swatch";
import { Globe } from "../../globe/globe";
import { GlobeImageryTypes } from "../../types";
import { round } from "lodash";

interface Settings2Props {
   visible: boolean;
   toggleVisible: () => void;
   displayPreferences: DisplayPreferences;
   globe: Globe;
}

const metricConversion = 3.2808;

const feetFromMeters = (m: number): number => round(m * metricConversion);

const metersFromFeet = (ft: number): number => ft / metricConversion;

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
            <Card title={"Status"}>
               Camera Altitude:{" "}
               {`${this.props.globe.cameraPosition.height} meters`}
            </Card>
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
                     Size:{" "}
                     <InputNumber
                        min={1}
                        max={10}
                        value={
                           this.props.displayPreferences.pointDisplayOptions
                              .size
                        }
                        onChange={(size) =>
                           this.props.displayPreferences.updatePointDisplay({
                              size
                           })
                        }
                        style={{ width: "60px" }}
                     />
                  </div>
                  <div>
                     Outline width:{" "}
                     <InputNumber
                        min={1}
                        max={10}
                        value={
                           this.props.displayPreferences.pointDisplayOptions
                              .outlineSize
                        }
                        onChange={(outlineSize) =>
                           this.props.displayPreferences.updatePointDisplay({
                              outlineSize
                           })
                        }
                        style={{ width: "60px" }}
                     />
                  </div>
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
                     checked={
                        this.props.displayPreferences.trackDisplayOptions
                           .showWhenSelected
                     }
                     onChange={({ target }) =>
                        this.props.displayPreferences.updateTrackDisplay({
                           showWhenSelected: target.checked
                        })
                     }
                  >
                     Show Tracks for selected aircraft
                  </Checkbox>
                  <Checkbox
                     checked={
                        this.props.displayPreferences.trackDisplayOptions
                           .showWhenCameraAdjacent
                     }
                     onChange={({ target }) =>
                        this.props.displayPreferences.updateTrackDisplay({
                           showWhenCameraAdjacent: target.checked
                        })
                     }
                  >
                     Show Tracks for aircraft near the camera
                  </Checkbox>
                  Color:
                  <Swatch
                     color={
                        this.props.displayPreferences.trackDisplayOptions.color
                     }
                     onChange={(color: string) =>
                        this.props.displayPreferences.updateTrackDisplay({
                           color
                        })
                     }
                  />
                  Size:{" "}
                  <InputNumber
                     min={1}
                     max={10}
                     value={
                        this.props.displayPreferences.trackDisplayOptions.size
                     }
                     onChange={(size) =>
                        this.props.displayPreferences.updateTrackDisplay({
                           size
                        })
                     }
                     style={{ width: "60px" }}
                  />
               </Panel>
               <Panel key={3} header={"Labels"}>
                  <Checkbox
                     checked={
                        this.props.displayPreferences.labelDisplayOptions
                           .showWhenSelected
                     }
                     onChange={({ target }) =>
                        this.props.displayPreferences.updateLabelDisplay({
                           showWhenSelected: target.checked
                        })
                     }
                  >
                     Show Labels for selected aircraft
                  </Checkbox>
                  <Checkbox
                     checked={
                        this.props.displayPreferences.labelDisplayOptions
                           .showWhenCameraAdjacent
                     }
                     onChange={({ target }) =>
                        this.props.displayPreferences.updateLabelDisplay({
                           showWhenCameraAdjacent: target.checked
                        })
                     }
                  >
                     Show Labels for aircraft near the camera
                  </Checkbox>
                  Max altitude to show nearby labels:
                  <Slider
                     value={
                        this.props.displayPreferences.labelDisplayOptions
                           .maxCameraHeight
                     }
                     onChange={(newVal) => {
                        const maxCameraHeight = newVal as number;
                        this.props.displayPreferences.updateLabelDisplay({
                           maxCameraHeight
                        });
                     }}
                     max={15_000_000}
                  />
                  Color:
                  <Swatch
                     color={
                        this.props.displayPreferences.labelDisplayOptions.color
                     }
                     onChange={(color: string) =>
                        this.props.displayPreferences.updateLabelDisplay({
                           color
                        })
                     }
                  />
                  Size:{" "}
                  <InputNumber
                     min={1}
                     max={10}
                     value={
                        this.props.displayPreferences.labelDisplayOptions.size
                     }
                     onChange={(size) =>
                        this.props.displayPreferences.updateLabelDisplay({
                           size
                        })
                     }
                     style={{ width: "60px" }}
                  />
               </Panel>
            </Collapse>
         </Drawer>
      );
   }
}

export default Settings2;
