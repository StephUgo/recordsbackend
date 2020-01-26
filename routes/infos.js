var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var db = req.dbRecords;
  var collection = db.get('soulfunk');
  res.render('infos', { title: 'System infos', dbVersion: 'MongoDB Version = 4.0'});
});

module.exports = router;
