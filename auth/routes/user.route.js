const { User, validate } = require("../model/user.model");
const express = require("express");
const router = express.Router();

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

  user = new User({
    name: req.body.name,
    password: req.body.password,
    email: req.body.email
  });
  // TODO : replace with some other hash function
  //user.password = await bcrypt.hash(user.password, 10);
  await user.save();

  res.status(200).json({ msg: 'New user is registered.' })
});

router.post("/login", async (req, res) => {
  // Validate the request body first
  const {error } = validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  // Find an existing user
  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(401).send("User hasn't registered yet.");
  }

  // TODO : replace by the comparison of hash values
  if (user.toObject().password !== req.body.password) {
    return res.status(401).send("Invalid password.");
  }

  // @ts-ignore
  const token = user.generateAuthToken();

  // Set it in the HTTP Response body
  res.status(200).json({
    idToken: token,
    expiresIn: 120
  });
});

module.exports = router;