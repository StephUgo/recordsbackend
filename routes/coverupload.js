var express = require('express');
var router = express.Router();
const auth = require('../auth/middleware/auth.service');

//multer object creation
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
 
router.post('/', auth, upload.single('imageupload'), function(req, res) {
  res.send(JSON.stringify("File uploaded successfully."));
});

module.exports = router;
