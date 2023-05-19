const express = require('express');
const app = express();
const port = process.env.PORT || 9000;
const dotenv = require('dotenv').config();
const db = require('./config/mongoose');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

app.use(express.urlencoded());

app.use('/', require('./routes'));

app.listen(port, function(err) {
    if(err) console.log(`Error in running the server: ${err}`);
    console.log(`Server is running on port: ${port}`);
});

module.exports = app;
