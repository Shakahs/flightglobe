import { Server, WebSocket } from "mock-socket";
import WebsocketHandler from "../websocketHandler";
import { FlightAPosition1, FlightAPosition2 } from "./mockData";
import { Message, UpdateRequest } from "../types";
import { noop } from "lodash-es";

describe("websocketHandler handles connection housekeeping", () => {
   const testServerURL = "ws://localhost:32000";
   let mockServer: Server;

   beforeEach(() => {
      mockServer = new Server(testServerURL);
   });

   afterEach(() => {
      mockServer.close();
   });

   it("initializes and stores the default websocket url", () => {
      const wsh = new WebsocketHandler();
      expect(wsh.url).toEqual(`ws://${window.location.host}/sub`);
   });

   it("initializes and stores the provided websocket url", () => {
      const wsh = new WebsocketHandler(undefined, testServerURL);
      expect(wsh.url).toEqual(testServerURL);
   });

   it("initializes and stores the default shouldSubscribe option", () => {
      const wsh = new WebsocketHandler();
      expect(wsh.shouldSubscribe).toBeTruthy();
   });

   it("initializes and stores the provided shouldSubscribe option", () => {
      const wsh = new WebsocketHandler(undefined, undefined, false);
      expect(wsh.shouldSubscribe).toBeFalsy();
   });

   it("changes the shouldSubscribe option", () => {
      const wsh = new WebsocketHandler();
      expect(wsh.shouldSubscribe).toBeTruthy();
      wsh.setShouldSubscribe(false);
      expect(wsh.shouldSubscribe).toBeFalsy();
      wsh.setShouldSubscribe(true);
      expect(wsh.shouldSubscribe).toBeTruthy();
   });

   it("determines if an unsubscribed handler is not subscribed", () => {
      const wsh = new WebsocketHandler(undefined, testServerURL, false);
      expect(wsh.isSubscribed).toBeFalsy();
   });

   it("subscribes", (done) => {
      expect(mockServer.clients().length).toEqual(0);
      setTimeout(() => {
         const wsh = new WebsocketHandler(undefined, testServerURL);
         done();
      }, 100);
   });

   it("determines if a subscribed handler is subscribed", (done) => {
      const wsh = new WebsocketHandler(undefined, testServerURL);
      setTimeout(() => {
         expect(wsh.isSubscribed).toBeTruthy();
         done();
      }, 100);
   });

   it("respects shouldSubscribe when subscribing", () => {
      expect(mockServer.clients().length).toEqual(0);
      const wsh = new WebsocketHandler(undefined, testServerURL, false);
      expect(mockServer.clients().length).toEqual(0);
      wsh.setShouldSubscribe(true);
      expect(mockServer.clients().length).toEqual(1);
   });

   it("unsubscribes", (done) => {
      const wsh = new WebsocketHandler(noop, testServerURL);
      expect(mockServer.clients().length).toEqual(1);
      const ws = wsh.ws as WebSocket;
      wsh.setShouldSubscribe(false);
      expect(ws.readyState).toEqual(2);
      setTimeout(() => {
         expect(wsh.ws).toBeNull();
         done();
      }, 1000);
   });

   it("receives a message", (done) => {
      mockServer.on("connection", (socket) => {
         socket.send(JSON.stringify(FlightAPosition1));
      });
      const wsh = new WebsocketHandler(undefined, testServerURL);
      expect(mockServer.clients().length).toEqual(1);
      setTimeout(() => {
         expect(wsh.messages.length).toEqual(1);
         expect(wsh.currentMessages[0]).toEqual(FlightAPosition1);
         done();
      }, 1000);
   });

   it("receives multiple messages", (done) => {
      mockServer.on("connection", (socket) => {
         socket.send(JSON.stringify(FlightAPosition1));
         socket.send(JSON.stringify(FlightAPosition2));
      });
      const wsh = new WebsocketHandler(undefined, testServerURL);
      setTimeout(() => {
         expect(mockServer.clients().length).toEqual(1);
         expect(wsh.messages.length).toEqual(2);
         expect(wsh.currentMessages[0]).toEqual(FlightAPosition1);
         expect(wsh.currentMessages[1]).toEqual(FlightAPosition2);
         done();
      }, 1000);
   });

   it("send update requests", (done) => {
      const updateRequest: UpdateRequest = { lastReceivedTimestamp: 22222 };

      mockServer.on("connection", (socket) => {
         //@ts-ignore
         socket.on("message", (data) => {
            //@ts-ignore
            expect(JSON.parse(data)).toEqual(updateRequest);
            done();
         });

         wsh.send(updateRequest);
      });

      const wsh = new WebsocketHandler(undefined, testServerURL);
   }, 20000);

   xit("gives a message to the callback", (done) => {
      mockServer.on("connection", (socket) => {
         socket.send(JSON.stringify(FlightAPosition1));
      });

      const cb = (msg: Message[]) => {
         expect(msg).toEqual([FlightAPosition1]);
         done();
      };

      const wsh = new WebsocketHandler(cb, testServerURL);

      setTimeout(noop, 1100);
   });

   it("clears messages after calling the callback", () => {
      jasmine.clock().install();

      mockServer.on("connection", (socket) => {
         socket.send(JSON.stringify(FlightAPosition1));
      });

      const wsh = new WebsocketHandler(noop, testServerURL);

      jasmine.clock().tick(100);
      expect(wsh.messages.length).toEqual(1);

      jasmine.clock().tick(1500);
      expect(wsh.messages.length).toEqual(0);

      jasmine.clock().uninstall();
   });

   it("does not attempt to send when the connection is not ready", (done) => {
      const wsh = new WebsocketHandler(noop, "ws://localhost:32001"); //non existent / offline server
      if (wsh.ws) {
         spyOn(wsh.ws, "send");
         const updateRequest: UpdateRequest = { lastReceivedTimestamp: 22222 };
         expect(() => wsh.send(updateRequest)).not.toThrow();
         expect(wsh.ws.send).not.toHaveBeenCalled();
      } else {
         fail("ws connection object not detected");
      }
      done();
   });

   describe("failed connection tests", function() {
      let originalTimeout;

      beforeEach(function() {
         originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
         jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
      });

      afterEach(function() {
         jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      });

      it("redials a failed connection after the appropriate delay", (done) => {
         const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
         const wsh = new WebsocketHandler(noop, "ws://localhost:32001"); //non existent / offline server
         spyOn(wsh, "wsSubscribe");
         setTimeout(() => {
            expect(wsh.wsSubscribe).toHaveBeenCalledTimes(1);
            done();
         }, 11000);
      });
   });
});
