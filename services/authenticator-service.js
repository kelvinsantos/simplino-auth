'use strict';
const jwt = require('jsonwebtoken');

module.exports = {
  sign: (payload, secretKey, options = {}) => {
    try {
      return Promise.resolve(jwt.sign(payload, secretKey, options));
    } catch (err) {
      return Promise.reject(err);
    }
  },
  verify: (token, secretKey, options = {}) => {
    try {
      return Promise.resolve(jwt.verify(token, secretKey, options));
    } catch (err) {
      return Promise.reject(err);
    }
  },
  decode: (token) => {
    return Promise.resolve(jwt.decode(token, { complete: true }));
    //returns null if token is invalid
  }
};
