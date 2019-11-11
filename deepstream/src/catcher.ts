import { initConnection } from "./deepstream";
import { DeepstreamClient } from "@deepstream/client";
import { GeoPositionList } from "../../lib/types";

if (require.main === module) {
   initConnection().then((conn) => {
      const ds = conn as any;
      const geohashList = ds.record.getList("geohashList");
      geohashList.subscribe((data: string[]) => {
         let count = 0;
         data.forEach(async (rec) => {
            const record = await ds.record.getRecord(rec).whenReady();
            count += Object.keys(record.get("flights")).length;
            console.log(
               record.get("geohash"),
               Object.keys(record.get("flights")).length,
               count
            );
         });
      });
   });
}
