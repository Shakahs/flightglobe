import { initConnection } from "./deepstream";
import { DeepstreamClient } from "@deepstream/client";
import { GeoPositionList } from "../../lib/types";
import {
   DS_GEOHASH_LIST_KEY,
   generateGeohashedPositionsKey
} from "../../lib/constants";

if (require.main === module) {
   initConnection().then((conn) => {
      const ds = conn as any;
      const geohashList = ds.record.getList(DS_GEOHASH_LIST_KEY);
      geohashList.subscribe((data: string[]) => {
         let count = 0;
         data.forEach(async (rec) => {
            const record = await ds.record
               .getRecord(generateGeohashedPositionsKey(rec))
               .whenReady();
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
