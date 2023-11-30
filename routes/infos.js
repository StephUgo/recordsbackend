var express = require('express');
var router = express.Router();

// Load MongoDB utils
const MongoDBAccess = require('../db/dbaccess');

// set up rate limiter: maximum of 30 requests per minute
const RateLimit = require('express-rate-limit');
const infosLimiter = RateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 300, // max requests per windowMs 
  message: "Keep quiet, maybe get a life instead of spamming the api.",
  headers: true
});

/* GET infos page. */
router.get('/', infosLimiter, function (req, res, next) {
  const db = MongoDBAccess.getDB();

  var collection = db.collection('records');
  collection.count({}, function (error, numOfDocs) {
    if (error) throw error;

    res.json( { title: 'System infos', dbVersion: 'MongoDB Version = 4.2', count: numOfDocs });
  });

});

module.exports = router;
