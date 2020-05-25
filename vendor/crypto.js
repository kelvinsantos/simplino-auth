const crypto = require('crypto');

module.exports = {
  generateRandomBytes: () => {
    return crypto.randomBytes(48).toString('hex');
  }
};