const auth = require("../middleware/auth.service");
//const bcrypt = require("bcrypt");
const { User, validate } = require("../model/user.model");
const express = require("express");
const router = express.Router();

router.get("/current", auth, async (req, res) => {
  // @ts-ignore
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/", async (req, res) => {
  // validate the request body first
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //find an existing user
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User({
    name: req.body.name,
    password: req.body.password,
    email: req.body.email
  });
  // TODO : replace with some other hash function
  //user.password = await bcrypt.hash(user.password, 10);
  await user.save();

  // @ts-ignore
  const token = user.generateAuthToken();
  res.header("x-auth-token", token).send({
    _id: user._id,
    // @ts-ignore
    name: user.name,
    // @ts-ignore
    email: user.email
  });
});

module.exports = router;