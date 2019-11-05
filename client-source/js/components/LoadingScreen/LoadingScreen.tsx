import * as React from "react";
import Modal from "reactstrap/lib/Modal";
import ModalHeader from "reactstrap/lib/ModalHeader";
import ModalBody from "reactstrap/lib/ModalBody";
import ModalFooter from "reactstrap/lib/ModalFooter";
import Button from "reactstrap/lib/Button";
import { FontAwesomeIcon as FontAwesome } from "@fortawesome/react-fontawesome";
import { Viewer } from "cesium";

interface LoadingScreenProps {
   viewer: Viewer;
}

interface LoadingScreenState {
   showModal: boolean;
   cesiumReady: boolean;
   timerID: number;
}

class LoadingScreen extends React.Component<
   LoadingScreenProps,
   LoadingScreenState
> {
   constructor(props) {
      super(props);
      this.state = {
         showModal: true,
         cesiumReady: false,
         timerID: 0
      };
      this.toggle = this.toggle.bind(this);
   }

   toggle() {
      this.setState({
         showModal: !this.state.showModal
      });
   }

   componentDidMount() {
      const timer = setInterval(() => {
         //@ts-ignore tilesLoaded is not in the TS definition
         if (this.props.viewer.scene.globe.tilesLoaded) {
            this.setState({
               cesiumReady: true
            });
            clearInterval(this.state.timerID);
         }
      }, 1000);
      //browser setInterval returns an integer ID, Node returns an object, TypeScript is following Node definition
      const timerID = (timer as unknown) as number;
      this.setState({
         timerID
      });
   }

   componentWillUnmount() {
      clearInterval(this.state.timerID);
   }

   render() {
      return (
         <Modal
            isOpen={this.state.showModal}
            modalClassName={"bg-gradient-secondary"}
            contentClassName={"bg-dark text-white"}
         >
            <ModalHeader>Flight Globe</ModalHeader>
            <ModalBody>
               <p>
                  Welcome to Flight Globe, a real-time map of worldwide air
                  traffic. Every point you see is an aircraft.
               </p>
            </ModalBody>
            <ModalFooter>
               {!this.state.cesiumReady && (
                  <FontAwesome icon="circle-notch" spin />
               )}
               <Button
                  disabled={!this.state.cesiumReady}
                  className={"bg-white text-dark"}
                  onClick={this.toggle}
               >
                  {this.state.cesiumReady ? (
                     <span>Continue</span>
                  ) : (
                     <span>Loading</span>
                  )}
               </Button>
            </ModalFooter>
         </Modal>
      );
   }
}

export default LoadingScreen;
