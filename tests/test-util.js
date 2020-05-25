const bcrypt = require("bcrypt");

// Load schemas
const Tenant = require("../schemas/tenant");
const User = require("../schemas/user");

class TestUtil {
  /**
   * @param {boolean} cleanDatabase - it will clean the database if true
   */
  static initDatabase(cleanDatabase) {
    // Empty the database
    if (cleanDatabase === true) {
      return TestUtil.cleanDatabase().then(() => {
        // Init base groups and role for access control
        return Promise.resolve();
      });
    }
  }

  /**
   * Clean the database
   */
  static cleanDatabase() {
    return Promise.all([
      Tenant.remove({}).exec(),
      User.remove({}).exec(),
    ]);
  }

  /**
   * Delay execution of the next promise
   * @param {Number} delay - delay to wait in milliseconds
   * @return {Promise} a thenable resolved promise
   */
  static delayPromise(delay) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, delay);
    });
  }

  /**
   * Higher order function that wrap an async function in try/catch and returns mocha's done
   * @param {Function} fn - function to wrap
   * @return {Function}
   */
  static testAsync(fn) {
    return (done) => {
      fn.call().then(() => {
        done();
      }).catch((err) => {
        done(err);
      });
    };
  }

  static hashPassword(passwordString) {
    let saltRounds = 10;
    return bcrypt.hash(passwordString, saltRounds);
  }
}

module.exports = TestUtil;