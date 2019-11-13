import { DeepstreamClient } from "@deepstream/client";
const {
   REMOTE_WINS
} = require("@deepstream/client/dist/record/merge-strategy");

export const provideConnection = async () => {
   const newConn = new DeepstreamClient("localhost:6020", {
      mergeStrategy: REMOTE_WINS
   });
   await newConn.login();
   return newConn;
};
