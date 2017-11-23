const express = require('express');
const morgan = require('morgan');

const app = express();
app.use(morgan('combined'));

app.get('/', (req, res) => res.send('Hello World!'));
// app.use('/', express.static('client'))

app.listen(3000, () => console.log('Example app listening on port 3000!'));
