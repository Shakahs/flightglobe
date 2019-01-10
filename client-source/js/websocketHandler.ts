import {createAtom, autorun, IAtom, observable, computed, action, reaction} from "mobx";
import {Message, UpdateRequest} from "./types";
import {forEach, noop} from "lodash-es";

export default class WebsocketHandler {
    @observable ws: WebSocket|null = null;
    @observable messages: Message[] = [];
    @observable shouldSubscribe:boolean;
    url: string;
    wsCallback: (msg: Message)=>void;

    constructor(wsCallback: (msg: Message)=>void = noop, url: string = `ws://${ window.location.host }/sub`, shouldSubscribe: boolean = true) {
        this.url = url;
        this.shouldSubscribe = shouldSubscribe;
        this.wsCallback = wsCallback;

        const wsAutorun = autorun(() => {
            const isSubscribed = this.isSubscribed;
            const shouldSubscribe = this.shouldSubscribe;
            if (!isSubscribed && shouldSubscribe) {
                this.wsSubscribe()
            }
            if(isSubscribed && !shouldSubscribe && this.ws) {
                this.ws.close()
            }
        }, {name: 'wsAutorun'});

        const wsCallbackReaction = reaction(
            ()=>this.messages,
            (messages: Message[])=>{
                forEach(messages, (message)=>{
                    this.wsCallback(message)
                });
                this.clearMessages()
            },
            {delay:1000}
        )

    }

    @action('setShouldSubscribe')
    setShouldSubscribe(v: boolean){
        this.shouldSubscribe = v;
    }

    @computed get isSubscribed():boolean {
        if(this.ws && this.ws.readyState <= 1){
            return true
        }
        return false
    }

    @action('wsSubscribe')
    wsSubscribe() {
        this.ws = new WebSocket(this.url);
        this.ws.onmessage = (msg: MessageEvent)=>this.wsMessage(msg);
        this.ws.onclose = ()=>this.wsClose();
    }

    @computed get currentMessages(){
        const returnedMessages:Message[] = [];
        this.messages.forEach((m)=>returnedMessages.push(m));
        return returnedMessages;
    }

    @action('clearMessages')
    clearMessages(){
        this.messages=[]
    }

    @action('wsMessage')
    wsMessage(msg: MessageEvent){
        this.messages.push(JSON.parse(msg.data))
    }

    @action('wsClose')
    wsClose(){
        this.ws = null;
    }

    send(msg: UpdateRequest){
        if(this.ws){
            this.ws.send(JSON.stringify(msg))
        }
    }

}