const express = require('express');
const morgan = require('morgan');
const rethinkdb = require('rethinkdb');
const grip = require('grip');
const expressGrip = require('express-grip');
const pubcontrol = require('pubcontrol');

const pub = new grip.GripPubControl({
  'control_uri': 'http://localhost:5561',
});

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
const sendData = () => {
  pub.publish('/data/all', new pubcontrol.Item(new grip.WebSocketMessageFormat(JSON.stringify(newData))));
  newData = {};
  console.log('data sent to client');
};

const chunkData = (item) => {
  newData[item.new_val.id] = item.new_val;
  if (Object.keys(newData).length >= 300) {
    sendData();
  }
};

const streamData = async () => {
  const conn = await rethinkConnect();
  const cursor = await rethinkdb.table('flight_position').changes({ squash: 5 }).run(conn);
  cursor.each((err, item) => {
    chunkData(item);
  });
};

app.use('/', express.static('./client-build'));
// app.get('/', (req, res) => res.send('Hello World!'));
app.use('/cesium', express.static('./node_modules/cesium/Build/Cesium'));
app.get('/all', getData);

app.use(expressGrip.preHandlerGripMiddleware);

app.all('/data/all', (req, res, next) => {
  // Reject non-WebSocket requests
  if (!expressGrip.verifyIsWebSocket(res, next)) {
    return;
  }

  // If this is a new connection, accept it and subscribe it to a channel
  const ws = expressGrip.getWsContext(res);
  if (ws.isOpening()) {
    ws.accept();
    ws.subscribe('/data/all');
    ws.detach();
  }

  // next() must be called for the post-handler middleware to execute
  next();
});

app.use(expressGrip.postHandlerGripMiddleware);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Example app listening on port ${ port }`));
console.log(`Server started on port ${ port }`);

// streamData();
