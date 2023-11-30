var express = require('express');
var router = express.Router();
const auth = require('../auth/middleware/auth.service');

// set up rate limiter: maximum of 10 requests per minute
const RateLimit = require('express-rate-limit');
const uploadLimiter = RateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // max requests per windowMs 
  message: "Keep quiet, maybe get a life instead of spamming the api.",
	headers: true
});

// multer object creation
var multer  = require('multer')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
  }
})
   
var upload = multer({ storage: storage })
 
router.post('/', uploadLimiter, auth, upload.array('picture'), function(req, res) {
  res.send(JSON.stringify("File uploaded successfully."));
});

module.exports = router;
