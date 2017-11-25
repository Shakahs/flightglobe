const express = require('express');
const morgan = require('morgan');
const rethinkdb = require('rethinkdb');
const sockio = require('socket.io');

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

let newData = {};
const streamData = async (io) => {
  const conn = await rethinkConnect();
  const cursor = await rethinkdb.table('flight_position').changes({ squash: 5 }).run(conn);
  cursor.each((err, item) => {
    newData[item.new_val.id] = item.new_val;
  });
  setInterval(() => {
    io.sockets.emit('update', newData);
    newData = {};
  }, 10000);
};

app.get('/', (req, res) => res.send('Hello World!'));
app.use('/cesium', express.static('./node_modules/cesium/Build/Cesium'));
app.use('/static', express.static('./static'));
app.get('/data', getData);

const port = process.env.PORT || 5000;
// app.listen(port, () => console.log(`Example app listening on port ${ port }`));
const io = sockio.listen(app.listen(port), { path: '/updates' });
console.log(`Server started on port ${ port }`);

streamData(io);
