import {createAtom, autorun, IAtom, observable, computed, action} from "mobx";
import {Message} from "./js/types";

export default class WebsocketHandler {
    @observable ws: WebSocket|null = null;
    @observable message: Message|null = null;
    @observable shouldSubscribe:boolean;
    url: string;

    constructor(url: string = `ws://${ window.location.host }/sub`, shouldSubscribe: boolean = true) {
        this.url = url;
        this.shouldSubscribe = shouldSubscribe;

        // const wsAutorun = autorun(() => {
        //     const isSubscribed = this.isSubscribed;
        //     if (!isSubscribed) {
        //         this.subscribe()
        //     }
        // }, {name: 'wsAutorun'});
    }

    @action('setShouldSubscribe')
    setShouldSubscribe(v: boolean){
        this.shouldSubscribe = v;
    }

    @action('subscribe')
    subscribe() {
        this.ws = new WebSocket(this.url);
        this.ws.onmessage = (msg: MessageEvent)=>{
            this.message = msg.data
        };
        this.ws.onclose = ()=>{
            this.ws = null;
        };
    }

    @computed get isSubscribed():boolean {
        if(this.ws && this.ws.readyState <= 2){
            return true
        }
        return false
    }
}