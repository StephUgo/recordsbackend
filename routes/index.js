var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET records search home page. */
router.get('/records', function(req, res, next) {
  res.render('records', { title: 'Records Engine' });
});

module.exports = router;
