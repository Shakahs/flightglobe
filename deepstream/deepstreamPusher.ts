import {
   FlightDemographics,
   FlightPosition,
   FlightRecord,
   Icao
} from "../client-source/js/types";
const { deepEquals } = require("@deepstream/client/dist/util/utils");
const { LOCAL_WINS } = require("@deepstream/client/dist/record/merge-strategy");
const Redis = require("ioredis");
const { DeepstreamClient } = require("@deepstream/client");

const redis = new Redis();
const ds = new DeepstreamClient("localhost:6020", {
   mergeStrategy: LOCAL_WINS
});

interface DSFlightRecord {
   icao: string;
   position: FlightPosition;
   demographic: FlightDemographics;
   time?: Date;
}

export interface BootData {
   [k: string]: FlightRecord;
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
   const bootData: BootData = {};

   stream.on("data", function(resultKeys: unknown[]) {
      // `resultKeys` is an array of strings representing key names.
      // Note that resultKeys may contain 0 keys, and that it will sometimes
      // contain duplicates due to SCAN's implementation in Redis.
      resultKeys.forEach(async (k) => {
         count++;
         const rawData = await redis.get(k);
         const pos: DSFlightRecord = JSON.parse(rawData);
         keys.add(pos.icao);

         const record = ds.record.getRecord(pos.icao);
         await record.whenReady();
         if (deepEquals(record.get(), {})) {
            // new record
            ds.record.setData(pos.icao, pos);
            newCount++;
         } else if (!deepEquals(record.get("Position"), pos.position)) {
            //update only position, only if it's changed
            record.set("Position", pos.position);
            updateCount++;
         }

         bootData[pos.icao] = {
            icao: pos.icao,
            positions: [pos.position],
            demographic: pos.demographic,
            time: pos.time
         };
      });
   });

   stream.on("end", async function() {
      console.log(
         `done looping over ${count} points, ${newCount} new, ${updateCount} updated`
      );
      const icaoList = ds.record.getList("icaoList");
      icaoList.setEntries(Array.from(keys));

      ds.record.setData("bootData", bootData);
      // console.log(bootData);
   });
};

const startLoop = () => {
   loop();
   setInterval(loop, 10 * 1000);
};

if (require.main === module) {
   init().then(startLoop);
}
