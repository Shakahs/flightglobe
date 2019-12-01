const { DeepstreamClient } = require("@deepstream/client");
const { LOCAL_WINS } = require("@deepstream/client/dist/record/merge-strategy");

export const initConnection = async (): Promise<unknown> => {
   const ds = new DeepstreamClient(
      `${process.env.DEEPSTREAM_HOST}:${process.env.DEEPSTREAM_PORT}`,
      {
         mergeStrategy: LOCAL_WINS
      }
   );
   console.log("starting deepstream server connection");
   await ds.login();
   console.log("connected to deepstream server");
   return ds;
};
