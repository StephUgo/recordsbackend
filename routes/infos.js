var express = require('express');
var router = express.Router();

// Load MongoDB utils
const MongoDBAccess = require('../db/dbaccess');

/* GET infos page. */
router.get('/', function (req, res, next) {
  const db = MongoDBAccess.getDB();

  var collection = db.collection('records');
  collection.count({}, function (error, numOfDocs) {
    if (error) throw error;

    res.json( { title: 'System infos', dbVersion: 'MongoDB Version = 4.2', count: numOfDocs });
  });

});

module.exports = router;
