const express = require('express');
const morgan = require('morgan');

const app = express();
app.use(morgan('combined'));

app.get('/', (req, res) => res.send('Hello World!'));
app.use('/cesium', express.static('./node_modules/cesium/Build/Cesium'));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Example app listening on port ${ port }`));
