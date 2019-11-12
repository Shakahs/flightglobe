import * as React from "react";
import FlightTable from "./FlightTable/FlightTable";
import { shallow } from "../ws-implementation/spec/karma-enzyme";
import { viewer } from "../ws-implementation/spec/mockSetup";
import { flightStore } from "../ws-implementation/spec/mockSetup";
import App from "./app";

describe("<App />", () => {
   it("renders a FlightTable", () => {
      const wrapper = shallow(<div />);
      // const wrapper = shallow(<App flightStore={flightStore}/>);
      expect(wrapper.contains(<div />)).toBeTruthy();
      expect(wrapper.contains(<span />)).toBeFalsy();
   });
});
