const multer = require('multer');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const promiseRetry = require('promise-retry');

//////////////////////
// MANAGEMENT OF USERS
//////////////////////
const config = require("config");
const mongoose = require("mongoose");

//use config module to get the privatekey, if no private key set, end the application
if (!config.get("privateKey")) {
  console.error("FATAL ERROR: privatekey is not defined.");
  process.exit(1);
}

const dbUrl = config.get('dbUrl');
if (!dbUrl) {
  console.error("FATAL ERROR: no URL for the database.");
  process.exit(1);
}
//connect to mongodb "recordsauth" database via mongoose

const options = {
  useNewUrlParser: true,
  reconnectTries: 60,
  reconnectInterval: 1000,
  poolSize: 10,
  bufferMaxEntries: 0
}

const promiseRetryOptions = {
  retries: options.reconnectTries,
  factor: 1.5,
  minTimeout: options.reconnectInterval,
  maxTimeout: 5000
}


promiseRetry((retry, number) => {
    console.log(`Mongooose connecting to ${dbUrl} - retry number: ${number}`)
    return mongoose.connect(dbUrl + "recordsauth", { useNewUrlParser: true }).catch(retry)
}, promiseRetryOptions);

/////////////////////
// MANAGE EXPRESS APP
/////////////////////
var app = express();

//Enable CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// @ts-ignore
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// @ts-ignore
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


///////////////////
// Records Database
///////////////////

// Load MongoDB utils
const MongoDB = require('./db/dbaccess');

// Connect to MongoDB and put server instantiation code inside
// because we start the connection first
MongoDB.connectDB(async () => {

  try {
    // Records DB access is ok, we can create and manage routes
    var records = require('./routes/records');
    var infos = require('./routes/infos');
    var coverupload = require('./routes/coverupload');
    var usersRoute = require("./auth/routes/user.route");

    app.use(function (req, res, next) {
      // @ts-ignore
      req.multer = multer;
      next();
    });


    app.use('/records', records);
    app.use('/records/uploadcover', coverupload);
    app.use('/infos', infos);
    app.use('/users', usersRoute);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
      var err = new Error('Not Found');
      // @ts-ignore
      err.status = 404;
      next(err);
    });

    // error handler
    app.use(function (err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};
      // render the error page
      res.status(err.status || 500);
      res.render('error');
    });

  } catch (e) {
    throw e
  }

})

module.exports = app;