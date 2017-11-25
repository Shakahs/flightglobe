const express = require('express');
const morgan = require('morgan');
const rethinkdb = require('rethinkdb');

const app = express();
app.use(morgan('combined'));

const rethinkConnect = async () => {
  const conn = await rethinkdb.connect({ db: 'flightglobe' });
  return conn;
};

const getData = async (req, res) => {
  const conn = await rethinkConnect();
  const cursor = await rethinkdb.table('flight_position').run(conn);
  const data = await cursor.toArray();
  res.json(data);
};

app.get('/', (req, res) => res.send('Hello World!'));
app.use('/cesium', express.static('./node_modules/cesium/Build/Cesium'));
app.get('/data', getData);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Example app listening on port ${ port }`));
