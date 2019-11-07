import { FlightDemographics, FlightPosition } from "./client-source/js/types";
const { deepEquals } = require("@deepstream/client/dist/util/utils");
const { LOCAL_WINS } = require("@deepstream/client/dist/record/merge-strategy");
const Redis = require("ioredis");
const { DeepstreamClient } = require("@deepstream/client");

const redis = new Redis();
const ds = new DeepstreamClient("localhost:6020", {
   mergeStrategy: LOCAL_WINS
});

interface FlightRecord {
   Icao: string;
   Position: FlightPosition;
   Demographic: FlightDemographics;
   Time?: Date;
}

const init = async () => {
   await ds.login();
};

const known = new Map();

const loop = () => {
   console.log("looping over points");
   let count = 0;
   let newCount = 0;
   let updateCount = 0;

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
         count++;
         const rawData = await redis.get(k);
         const pos: FlightRecord = JSON.parse(rawData);
         keys.add(pos.Icao);

         const record = ds.record.getRecord(pos.Icao);
         await record.whenReady();
         if (deepEquals(record.get(), {})) {
            // new record
            ds.record.setData(pos.Icao, pos);
            newCount++;
         } else if (!deepEquals(record.get("Position"), pos.Position)) {
            //update only position, only if it's changed
            record.set("Position", pos.Position);
            updateCount++;
         }
      });
   });

   stream.on("end", async function() {
      console.log(
         `done looping over ${count} points, ${newCount} new, ${updateCount} updated`
      );
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
