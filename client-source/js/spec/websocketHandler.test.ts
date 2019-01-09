// import { Server } from 'mock-socket';
import WebsocketHandler from "../../websocketHandler";
import {FlightAPosition1} from "./mockData";

describe('websocketHandler',()=>{

    const testServerURL = 'ws://localhost:8080';
    let mockServer;
    let mockSocket;

    beforeAll( ()=>{
        // mockServer = new Server(testServerURL);
        // mockServer.on('connection', socket => {
        //     mockSocket = socket
        // });
    });

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

   xit('determines if a new handler is not subscribed',()=>{
       const wsh = new WebsocketHandler(testServerURL,false);
       expect(wsh.isSubscribed).toBeFalsy()
   })

    xit('attempts to subscribe', ()=>{
        const wsh = new WebsocketHandler(testServerURL,false);
        const spy = spyOn(wsh,'subscribe');
        wsh.shouldSubscribe = true;
        expect(spy).toHaveBeenCalled()
    })

});