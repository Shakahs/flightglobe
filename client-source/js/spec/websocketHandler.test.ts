import { Server, WebSocket } from 'mock-socket';
import WebsocketHandler from "../websocketHandler";
import {FlightAPosition1, FlightAPosition2} from "./mockData";
import {UpdateRequest} from "../types";

describe('websocketHandler handles connection housekeeping',()=>{

    const testServerURL = 'ws://localhost:32000';
    let mockServer: Server;

    beforeEach( ()=>{
        mockServer = new Server(testServerURL);
    });

    afterEach(()=>{
        mockServer.close();
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

    it('unsubscribes',(done)=>{
        const wsh = new WebsocketHandler(testServerURL);
        expect(mockServer.clients().length).toEqual(1);
        const ws = wsh.ws as WebSocket;
        wsh.setShouldSubscribe(false);
        expect(ws.readyState).toEqual(2)
        setTimeout(()=>{
            expect(wsh.ws).toBeNull();
            done()
        }, 1000)
    })

    it('receives a message',(done)=>{
        mockServer.on('connection', socket => {
            socket.send(JSON.stringify(FlightAPosition1));
        });
        const wsh = new WebsocketHandler(undefined,testServerURL);
        expect(mockServer.clients().length).toEqual(1)
        setTimeout(()=>{
            expect(wsh.messages.length).toEqual(1);
            expect(wsh.currentMessages[0]).toEqual(FlightAPosition1);
            done()
        },100)
    });

    it('receives multiple messages',(done)=>{
        mockServer.on('connection', socket => {
            socket.send(JSON.stringify(FlightAPosition1));
            socket.send(JSON.stringify(FlightAPosition2));
        });
        const wsh = new WebsocketHandler(undefined,testServerURL);
        expect(mockServer.clients().length).toEqual(1)
        setTimeout(()=>{
            expect(wsh.messages.length).toEqual(2);
            expect(wsh.currentMessages[0]).toEqual(FlightAPosition1);
            expect(wsh.currentMessages[1]).toEqual(FlightAPosition2);
            done()
        },100)
    });

    it('send update requests',(done)=>{
        const updateRequest: UpdateRequest = {lastReceivedTimestamp: 22222};

        mockServer.on('connection', socket => {
            //@ts-ignore
            socket.on('message', data => {
                expect(JSON.parse(data)).toEqual(updateRequest);
                done()
            });
        });

        const wsh = new WebsocketHandler(undefined,testServerURL);
        wsh.send(updateRequest);
    })

    xit('gives a message to the callback',()=>{

    })
});

