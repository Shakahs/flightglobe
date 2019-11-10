import { BootData, DeepstreamFlightRecord } from "../lib/types";
import { initConnection } from "./deepstream";
const { deepEquals } = require("@deepstream/client/dist/util/utils");
const Redis = require("ioredis");

const redis = new Redis();

const work = (ds) => {
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
         const pos: DeepstreamFlightRecord = JSON.parse(rawData);
         keys.add(pos.icao);

         const record = ds.record.getRecord(pos.icao);
         await record.whenReady();
         if (deepEquals(record.get(), {})) {
            // new record
            ds.record.setData(pos.icao, pos);
            newCount++;
         } else if (!deepEquals(record.get("Position"), pos.latestPosition)) {
            //update only position, only if it's changed
            record.set("latestPosition", pos.latestPosition);
            updateCount++;
         }

         bootData[pos.icao] = {
            icao: pos.icao,
            positions: [pos.latestPosition],
            demographic: pos.demographic,
            time: pos.updated
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

if (require.main === module) {
   initConnection().then((ds) => {
      const loop = () => {
         work(ds);
      };
      loop();
      setInterval(loop, 10 * 1000);
   });
}
