import { FlightPosition } from "../lib/types";
import * as faker from "faker";
const geohash = require("ngeohash");

const fakeFlightPosition = (): FlightPosition => {
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
