import { FlightPosition, RedisFlightRecord } from "../lib/types";
import * as faker from "faker";
const geohash = require("ngeohash");

export const fakeFlightPosition = (): FlightPosition => {
   const latitude = Number(faker.address.latitude());
   const longitude = Number(faker.address.longitude());

   return {
      latitude,
      longitude,
      geohash: geohash.encode(latitude, longitude),
      altitude: faker.random.number({ min: 20000, max: 35000 }),
      heading: faker.random.number(359),
      timestamp: new Date().getTime()
   };
};

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
   for (let i = 0; i++; i < count) {
      newArr.push(gen());
   }
   return newArr;
};
