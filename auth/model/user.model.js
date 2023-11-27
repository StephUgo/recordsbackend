const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');
const fs = require('fs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 255
  },
  salt: {
    type: String,
    required: true,
    minlength: 16,
    maxlength: 32
  },
  isAdmin: Boolean
});

const privateKey = fs.readFileSync(config.get('privateKey'));

// Custom method to generate authToken 
UserSchema.methods.generateAuthToken = function() { 
  // Replace private key with RS256 key
  const token = jwt.sign(
    { _id: this._id, isAdmin: this.isAdmin }, 
      privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '10m'
      }
    );
  return token;
}

const User = mongoose.model('User', UserSchema);

// Function to validate user 
function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(3).max(255).required()
  });

  return schema.validate(user);
}

exports.User = User; 
exports.validate = validateUser;