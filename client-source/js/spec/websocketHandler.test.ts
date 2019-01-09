import { Server, WebSocket } from 'mock-socket';
import WebsocketHandler from "../../websocketHandler";
import {FlightAPosition1} from "./mockData";

describe('websocketHandler',()=>{

    const testServerURL = 'ws://localhost:8080';
    let mockServer: Server;
    let mockSocket: WebSocket;

    beforeEach( ()=>{
        mockServer = new Server(testServerURL);
        mockServer.on('connection', socket => {
            mockSocket = socket
        });
    });

    afterEach(()=>{
        mockServer.close()
    })

    it('initializes and stores the default websocket url', ()=>{
        const wsh = new WebsocketHandler();
        expect(wsh.url).toEqual(`ws://${ window.location.host }/sub`)
    });

    it('initializes and stores the provided websocket url', ()=>{
       const wsh = new WebsocketHandler(testServerURL);
       expect(wsh.url).toEqual(testServerURL)
    });

    it('initializes and stores the default shouldSubscribe option', ()=>{
        const wsh = new WebsocketHandler();
        expect(wsh.shouldSubscribe).toBeTruthy()
    });

    it('initializes and stores the provided shouldSubscribe option', ()=>{
        const wsh = new WebsocketHandler(undefined, false);
        expect(wsh.shouldSubscribe).toBeFalsy()
    });

    it('changes the shouldSubscribe option', ()=>{
        const wsh = new WebsocketHandler();
        expect(wsh.shouldSubscribe).toBeTruthy();
        wsh.setShouldSubscribe(false);
        expect(wsh.shouldSubscribe).toBeFalsy();
        wsh.setShouldSubscribe(true);
        expect(wsh.shouldSubscribe).toBeTruthy();
    });

   it('determines if an unsubscribed handler is not subscribed',()=>{
       const wsh = new WebsocketHandler(testServerURL,false);
       expect(wsh.isSubscribed).toBeFalsy()
   })

    it('subscribes',()=>{
        expect(mockServer.clients().length).toEqual(0);
        const wsh = new WebsocketHandler(testServerURL);
        expect(mockServer.clients().length).toEqual(1)
    })

    it('determines if a subscribed handler is subscribed',()=>{
        const wsh = new WebsocketHandler(testServerURL);
        expect(wsh.isSubscribed).toBeTruthy()
    })

    it('respects shouldSubscribe when subscribing',()=>{
        expect(mockServer.clients().length).toEqual(0);
        const wsh = new WebsocketHandler(testServerURL,false);
        expect(mockServer.clients().length).toEqual(0)
        wsh.setShouldSubscribe(true);
        expect(mockServer.clients().length).toEqual(1)
    })

    it('unsubscribes',()=>{
        const wsh = new WebsocketHandler(testServerURL);
        expect(mockServer.clients().length).toEqual(1);
        const ws = wsh.ws as WebSocket;
        wsh.setShouldSubscribe(false);
        expect(ws.readyState).toEqual(2)
    })
});