import {
   createAtom,
   autorun,
   IAtom,
   observable,
   computed,
   action,
   reaction,
   IReactionDisposer
} from "mobx";
import { Message, UpdateRequest } from "../types";
import { forEach, noop } from "lodash-es";
import { differenceInMilliseconds } from "date-fns";

export default class WebsocketHandler {
   @observable ws: WebSocket | null = null;
   @observable.shallow messages: Message[] = [];
   @observable shouldSubscribe: boolean;
   lastDialTime: Date = new Date(2017);
   url: string;
   wsCallback: (msg: Message[]) => void | null;
   wsAutorunDisposer: IReactionDisposer;
   wsCallbackReactionDisposer: IReactionDisposer;

   constructor(
      wsCallback: (msg: Message[]) => void = noop,
      providedUrl: string = "",
      shouldSubscribe: boolean = true
   ) {
      const wsProtocol =
         window.location.protocol.toLowerCase() === "https:" ? "wss" : "ws";
      this.url =
         providedUrl !== ""
            ? providedUrl
            : `${wsProtocol}://${window.location.host}/sub`;
      this.shouldSubscribe = shouldSubscribe;
      this.wsCallback = wsCallback;

      this.wsAutorunDisposer = autorun(
         () => {
            const isSubscribed = this.isSubscribed;
            const shouldSubscribe = this.shouldSubscribe;
            if (!isSubscribed && shouldSubscribe) {
               const timeElapsed: number = differenceInMilliseconds(
                  new Date(),
                  this.lastDialTime
               );
               const timeToWait = 10 * 1000 - timeElapsed;
               if (timeToWait > 0) {
                  setTimeout(() => {
                     this.wsSubscribe();
                  }, Math.max(timeToWait, 10));
               } else {
                  this.wsSubscribe();
               }
            }
            if (isSubscribed && !shouldSubscribe && this.ws) {
               this.ws.close();
            }
         },
         { name: "wsAutorun" }
      );

      this.wsCallbackReactionDisposer = reaction(
         () => {
            const returnedMessages: Message[] = [];
            this.messages.forEach((m) => returnedMessages.push(m));
            return returnedMessages;
         },
         (messages: Message[]) => {
            this.wsCallback(messages);
            this.clearMessages();
         },
         { delay: 1000 }
      );
   }

   @action("setShouldSubscribe")
   setShouldSubscribe(v: boolean) {
      this.shouldSubscribe = v;
   }

   @computed get isSubscribed(): boolean {
      if (this.ws && this.ws.readyState <= 1) {
         return true;
      }
      return false;
   }

   @action("wsSubscribe")
   wsSubscribe() {
      this.lastDialTime = new Date();
      this.ws = new WebSocket(this.url);
      this.ws.onmessage = (msg: MessageEvent) => this.wsMessage(msg);
      this.ws.onclose = () => this.wsClose();
   }

   @computed get currentMessages() {
      const returnedMessages: Message[] = [];
      this.messages.forEach((m) => returnedMessages.push(m));
      return returnedMessages;
   }

   @action("clearMessages")
   clearMessages() {
      this.messages = [];
   }

   @action("wsMessage")
   wsMessage(msg: MessageEvent) {
      this.messages.push(JSON.parse(msg.data));
   }

   @action("wsClose")
   wsClose() {
      this.ws = null;
   }

   send(msg: UpdateRequest) {
      if (this.ws && this.ws.readyState === 1) {
         this.ws.send(JSON.stringify(msg));
      }
   }
}
