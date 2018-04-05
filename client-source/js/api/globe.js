import { apiHandler } from './handler';

export const retrieveGlobalSnapshot = async () => {
  try {
    const { data } = await (apiHandler.get('/sub/globalSnapshot'));
    return data;
  } catch (err) {
    console.log(err.message);
    return null;
  }
};

export const retrieveFlightHistory = async (icao) => {
  try {
    const { data } = await (apiHandler.get(`/sub/${ icao }`));
    return data;
  } catch (err) {
    console.log(err.message);
    return null;
  }
};

