const { DeepstreamClient } = require("@deepstream/client");
const { LOCAL_WINS } = require("@deepstream/client/dist/record/merge-strategy");

export const initConnection = async (): Promise<unknown> => {
   const ds = new DeepstreamClient("localhost:6020", {
      mergeStrategy: LOCAL_WINS
   });
   await ds.login();
   return ds;
};
