import { mount } from "../../spec/karma-enzyme";
import * as React from "react";
import Menu from "./Menu";
import { noop } from "lodash-es";
import { globe } from "../../spec/mockSetup";
import { Button, DropdownItem } from "reactstrap";

describe("<Menu />", () => {
   it("renders a FlightTable", () => {
      const wrapper = mount(
         <Menu
            toggleShowFlightTable={noop}
            toggleShowInfoModal={noop}
            globe={globe}
         />
      );
      // const wrapper = shallow(<App flightStore={flightStore}/>);
      expect(wrapper.find(Button).length).toEqual(3);
      expect(wrapper.find(DropdownItem).length).toEqual(2);
      expect(
         wrapper
            .find(DropdownItem)
            .first()
            .props().active
      ).toBeTruthy();
   });
});
