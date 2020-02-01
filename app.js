var multer  =   require('multer');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// Database
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/nodetest2',null, null);
// Modified to Work dockerized MongoDb : use localhost instead of database if you're not using the dockerized MongoDb AND calling from
// a dockerized node app
//var dbRecords = monk('database:27017/recordcollectiondb',null,null);
var dbRecords = monk('localhost:27017/recordcollectiondb',null,null);

var index = require('./routes/index');
var users = require('./routes/users');
var records = require('./routes/records');
var infos = require('./routes/infos');
var coverupload = require('./routes/coverupload');

var app = express();

//Enable CORS
app.use(function(req, res, next) {
 res.header("Access-Control-Allow-Origin", "*");
 res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
 res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
 next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Make our dbs accessible to our router
app.use(function(req,res,next){
    // @ts-ignore
    req.db = db;
    //@ts-ignore
    req.dbRecords = dbRecords;
    // @ts-ignore
    req.multer = multer;
    next();
});


app.use('/', index);
app.use('/users', users);
app.use('/records', records);
app.use('/records/uploadcover', coverupload);
app.use('/infos', infos);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  // @ts-ignore
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
