import * as React from "react";
import Collapse from "reactstrap/lib/Collapse";
import { Color, ColorState, GithubPicker } from "react-color";

interface SwatchProps {
   color: string;
   onChange: (color: string) => void;
}

interface SwatchState {
   pickerOpen: boolean;
}

class Swatch extends React.Component<SwatchProps, SwatchState> {
   constructor(props) {
      super(props);
      this.state = {
         pickerOpen: false
      };
      this.toggle = this.toggle.bind(this);
   }

   toggle() {
      this.setState({
         pickerOpen: !this.state.pickerOpen
      });
   }

   render() {
      return (
         <React.Fragment>
            <div className={"swatch"} onClick={this.toggle}>
               <div
                  className={"swatch-inner"}
                  style={{ backgroundColor: this.props.color }}
               />
            </div>
            <Collapse isOpen={this.state.pickerOpen}>
               <GithubPicker
                  color={this.props.color}
                  onChangeComplete={(color: ColorState) =>
                     this.props.onChange(color.hex)
                  }
               />
            </Collapse>
         </React.Fragment>
      );
   }
}

export default Swatch;
