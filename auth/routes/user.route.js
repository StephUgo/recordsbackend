'use strict';
var crypto = require('crypto');
const { User, validate } = require("../model/user.model");
const express = require("express");
const router = express.Router();
const auth = require('../../auth/middleware/auth.service');

router.post("/register", async (req, res) => {
  // Validate the request body first
  const { error } = validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  // Find an existing user
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).send("User already registered.");
  }


  var salt = genRandomString(16); // Gives us salt of length 16
  var passwordData = sha512(req.body.password, salt);

  user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: passwordData.passwordHash,
    salt: passwordData.salt
  });

  await user.save();

  res.status(200).json({ msg: 'New user is registered.' })
});

router.post("/login", async (req, res) => {
  // Validate the request body first
  const { error } = validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  // Find an existing user
  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(401).send("User hasn't registered yet.");
  }

  const jsUser = user.toObject();
  // Comparison of the salted hash values
  if (jsUser.passwordHash !== sha512(req.body.password, jsUser.salt).passwordHash) {
    return res.status(401).send("Invalid password.");
  }

  // @ts-ignore
  const token = user.generateAuthToken();

  // Set it in the HTTP Response body
  res.status(200).json({
    idToken: token,
    expiresIn: 600
  });
});

/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 */
var genRandomString = function (length) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex') /** convert to hexadecimal format */
    .slice(0, length);   /** return required number of characters */
};

/**
* hash password with sha512.
* @function
* @param {string} password - List of required fields.
* @param {string} salt - Data to be validated.
*/
var sha512 = function (password, salt) {
  var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
  hash.update(password);
  var value = hash.digest('hex');
  return {
    salt: salt,
    passwordHash: value
  };
};


router.post("/updatepwd", auth, async (req, res) => {
  if (req.body.user === undefined) {
    return res.status(400).send("Undefined user.");
  }
  if (req.body.newpassword === undefined) {
    return res.status(400).send("Undefined new password.");
  }
  // Validate the user provided in the request body first
  const { error } = validate(req.body.user);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  // Find an existing user
  let user = await User.findOne({ email: req.body.user.email });
  if (!user) {
    return res.status(400).send("Unknown user.");
  }

  const jsUser = user.toObject();
  // Check that the old password is correct
  if (jsUser.passwordHash !== sha512(req.body.user.password, jsUser.salt).passwordHash) {
    return res.status(401).send("Invalid password.");
  }

  // Delete old version of User
  await User.deleteOne({ email: req.body.user.email });

  var salt = genRandomString(16); // Gives us salt of length 16
  var passwordData = sha512(req.body.newpassword, salt);

  user = new User({
    name: req.body.user.name,
    email: req.body.user.email,
    passwordHash: passwordData.passwordHash,
    salt: passwordData.salt
  });

  // Save new version of User
  await user.save();

  res.status(200).json({ msg: 'User data updated.' })
});


module.exports = router;