var multer = require('multer');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

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

//connect to mongodb "recordsauth" database via mongoose
mongoose
  .connect("mongodb://localhost/recordsauth", { useNewUrlParser: true })
  .then(() => console.log("Connected to MongoDB..."))
  .catch(err => console.error("Could not connect to MongoDB..."));



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

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


///////////////////
// Records Database
///////////////////

// Load MongoDB utils
const MongoDB = require('./db/dbaccess');

// Connect to MongoDB and put server instantiation code inside
// because we start the connection first
MongoDB.connectDB(async (err) => {
  if (err) throw err

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
    app.use("/users", usersRoute);

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