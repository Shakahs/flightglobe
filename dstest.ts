import { FlightDemographics, FlightPosition } from "./client-source/js/types";
const { LOCAL_WINS } = require("@deepstream/client/dist/record/merge-strategy");
const Redis = require("ioredis");
const { DeepstreamClient } = require("@deepstream/client");

const redis = new Redis();
const ds = new DeepstreamClient("localhost:6020", {
   mergeStrategy: LOCAL_WINS
});

interface FlightRecord {
   Icao: string;
   Positions: FlightPosition;
   Demographic: FlightDemographics;
   Time?: Date;
}

const init = async () => {
   await ds.login();
};

const loop = () => {
   console.log("looping over points");
   let count = 0;

   const stream = redis.scanStream({
      match: "position:*",
      count: 100
   });

   const keys = new Set<string>();

   stream.on("data", function(resultKeys: unknown[]) {
      // `resultKeys` is an array of strings representing key names.
      // Note that resultKeys may contain 0 keys, and that it will sometimes
      // contain duplicates due to SCAN's implementation in Redis.
      resultKeys.forEach(async (k) => {
         const rawData = await redis.get(k);
         const pos: FlightRecord = JSON.parse(rawData);
         keys.add(pos.Icao);

         try {
            ds.record.setData(pos.Icao, pos);
         } catch (e) {
            console.log(pos.Icao, e);
         }

         count++;
      });
   });

   stream.on("end", async function() {
      console.log(`done looping over ${count} points`);
      const icaoList = ds.record.getList("icaoList");
      icaoList.setEntries(Array.from(keys));
   });
};

const startLoop = () => {
   loop();
   setInterval(loop, 10 * 1000);
};

if (require.main === module) {
   init().then(startLoop);
}
