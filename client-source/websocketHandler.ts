import {createAtom, autorun, IAtom, observable, computed, action} from "mobx";
import {Message, UpdateRequest} from "./js/types";

export default class WebsocketHandler {
    @observable ws: WebSocket|null = null;
    @observable messages: Message[] = [];
    @observable shouldSubscribe:boolean;
    url: string;

    constructor(url: string = `ws://${ window.location.host }/sub`, shouldSubscribe: boolean = true) {
        this.url = url;
        this.shouldSubscribe = shouldSubscribe;

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
        this.messages = [];
        return returnedMessages;
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