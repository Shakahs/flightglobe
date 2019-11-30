import { RedisFlightRecord } from "../../../lib/types";
import * as faker from "faker";
import { fakeFlightPosition } from "../../../lib/spec/fakeData";

export const fakeRedisFlightRecord = (): RedisFlightRecord => {
   const position = fakeFlightPosition();

   return {
      position,
      icao: faker.random.alphaNumeric(6),
      demographic: {
         origin: faker.address.city(),
         destination: faker.address.city(),
         model: "747-800"
      }
   };
};

export const fillArray = <T>(gen, count): T[] => {
   const newArr: T[] = [];
   for (let i = 0; i < count; i++) {
      newArr.push(gen());
   }
   return newArr;
};
