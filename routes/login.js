var express = require('express');
var router = express.Router();

import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

router.post('/api/login',loginRoute);

const RSA_PRIVATE_KEY = fs.readFileSync('./demos/private.key');

export function loginRoute(req, res) {

    const email = req.body.email,
          password = req.body.password;

    if (validateEmailAndPassword(email, password)) {
      const userId = findUserIdForEmail(email);

      const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
                algorithm: 'RS256',
                expiresIn: 120,
                subject: userId
            });

          // send the JWT back to the user
          // TODO - multiple options available                              
    } 
    else {
        // send status 401 Unauthorized
        res.sendStatus(401); 
    }
}

function validateEmailAndPassword(email, password) {
  // TODO
  return true;
}

function findUserIdForEmail(email) {
  // TODO
  return "toto";
}

module.exports = router;
