const multer = require('multer');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const promiseRetry = require('promise-retry');
const figlet = require('figlet');

////////////////////////
// APP & VERSION DISPLAY
////////////////////////
const version = process.env.npm_package_version;

// We wrap figlet function into a promise for a more practical use
function figletFunctionWrapper() {
  return new Promise((resolve, reject) => {
    figlet.text('Records Backend', {
      font: 'Big',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: true
    }, function(err, data) {
      var versionSuffix = '\nRecords Backend Version Number : ' + version + '\n';
      if (err) {
          reject('Something went wrong using figlet...'+ versionSuffix);
      }
      resolve(data + versionSuffix);
    });
  });
}

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


// INITIAL CONNECTION OF MONGOOSE TO MONGODB (used for recordsauth DB)
promiseRetry((retry, number) => {
    console.log(`Mongooose connecting to ${dbUrl} - retry number: ${number}`)
    return mongoose.connect(dbUrl + "recordsauth", { useNewUrlParser: true }).then(() => {
      console.log(`Mongooose connected to ${dbUrl} !`);
      // USER DB IS OK, WE PROCEED AND DISPLAY THE APP LOGO
      figletFunctionWrapper().then((data)=> {console.log(data)})
        .catch((error)=> {console.log(error)});
    }).catch(retry)
}, promiseRetryOptions);

/////////////////////
// MANAGE EXPRESS APP
/////////////////////
var app = express();

// set up rate limiter: maximum of 10 requests per minute
const RateLimit = require('express-rate-limit');
const limiter = RateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // max 100 requests per windowMs
  message: "Keep quiet, maybe get a life instead of spamming the api.",
	standardHeaders: true,
	legacyHeaders: true, 
  skipFailedRequests: true
});

// apply rate limiter to all requests
app.use(limiter);

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
const c = require('config');
const date = require('joi/lib/types/date');


// INITIAL CONNECTION TO MONGODB WITH THE NODEJS DRIVER (used for records DB)
// Note : Connect to MongoDB and put server instantiation code inside
// because we start the connection first
MongoDB.connectDB(async () => {
  try {
    // Records DB access is ok, we can create and manage routes
    var records = require('./routes/records');
    var infos = require('./routes/infos');
    var coverupload = require('./routes/coverupload');
    var usersRoute = require("./auth/routes/user.route");
    var studios = require('./routes/studios');

    app.use(function (req, res, next) {
      // @ts-ignore
      req.multer = multer;
      next();
    });


    app.use('/records', records);
    app.use('/records/uploadcover', coverupload);
    app.use('/infos', infos);
    app.use('/users', usersRoute);
    app.use('/studios', studios);

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