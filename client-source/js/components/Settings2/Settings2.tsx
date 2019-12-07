import * as React from "react";
import {
   Select,
   Checkbox,
   Drawer,
   Collapse,
   InputNumber,
   Card,
   Slider,
   Divider
} from "antd";
import { DisplayPreferences } from "../../ds-implementation/DisplayPreferences";
import { observer } from "mobx-react";
import Swatch from "../Swatch/Swatch";
import { Globe } from "../../globe/globe";
import { GlobeImageryTypes } from "../../types";
import { round } from "lodash";
import { DemographicsManager } from "../../ds-implementation/DemographicsManager";

interface Settings2Props {
   visible: boolean;
   toggleVisible: () => void;
   displayPreferences: DisplayPreferences;
   globe: Globe;
   demographics: DemographicsManager;
}

const metricConversion = 3.2808;

const feetFromMeters = (m: number): number => round(m * metricConversion);

const metersFromFeet = (ft: number): number => ft / metricConversion;

@observer
class Settings2 extends React.Component<Settings2Props> {
   render() {
      const { Panel } = Collapse;
      const { Option } = Select;
      const dividerStyle = { margin: "6px 0" };

      return (
         <Drawer
            visible={this.props.visible}
            closable
            title={"Settings"}
            placement={"left"}
            onClose={this.props.toggleVisible}
         >
            <Card title={"Status"}>
               <span>
                  Camera Altitude:
                  <br />
                  {`${round(this.props.globe.cameraPosition.height)} meters`}
                  <br />
                  Tracked flights:
                  <br />
                  {this.props.demographics.demographicsMap.size}
               </span>
            </Card>
            <Collapse defaultActiveKey={0} style={{ textAlign: "right" }}>
               <Panel header={"General"} key={0}>
                  <b style={{ textAlign: "left" }}>When Selected:</b>
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
                     Show Tracks
                  </Checkbox>
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
                     Show Labels
                  </Checkbox>
                  <Divider style={dividerStyle} />
                  <b style={{ textAlign: "left" }}>When Nearby:</b>
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
                     Show Tracks
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
                     Show Labels
                  </Checkbox>
                  <Divider style={dividerStyle} />
                  <b>Altitude cutoff:</b>
                  <InputNumber
                     value={
                        this.props.displayPreferences.trackDisplayOptions
                           .maxCameraHeight
                     }
                     onChange={(maxCameraHeight) =>
                        this.props.displayPreferences.updateTrackDisplay({
                           maxCameraHeight
                        })
                     }
                     max={15_000_000}
                  />{" "}
                  Tracks
                  <br />
                  <InputNumber
                     value={
                        this.props.displayPreferences.labelDisplayOptions
                           .maxCameraHeight
                     }
                     onChange={(maxCameraHeight) =>
                        this.props.displayPreferences.updateLabelDisplay({
                           maxCameraHeight
                        })
                     }
                     max={15_000_000}
                  />{" "}
                  Labels
                  <Divider style={dividerStyle} />
                  <b>Imagery:</b>
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
                  <Divider style={dividerStyle} />
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
                  <Divider style={dividerStyle} />
                  <div>
                     <span>Fill Color:</span>
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
                  <Divider style={dividerStyle} />
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
                  Line Size:{" "}
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
                  <Divider style={dividerStyle} />
                  Line Color:
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
               </Panel>
               <Panel key={3} header={"Labels"}>
                  Font Size:{" "}
                  <InputNumber
                     min={1}
                     max={25}
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
                  <Divider style={dividerStyle} />
                  Font Color:
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
               </Panel>
            </Collapse>
         </Drawer>
      );
   }
}

export default Settings2;
