import 'es6-promise';

const axios = require('axios');

const apiHandler = axios.create({
  timeout: 1000,
});

export {
  apiHandler,
};
