var express = require('express');
var router = express.Router();

// Services
const userService = require("../services/user-service");

// Utils
const validationUtils = require("../utils/validation-utils");

router.post('/', function(req, res, next) {
  validationUtils.validateOrReject(req.body, {
    email: { type: "string", required: false },
    access: { type: "string", required: false },
    first_name: { type: "string", required: false },
    last_name: { type: "string", required: false },
    external_id: { type: "string", required: true },
  }).then(async (payload) => {
    let _payload = payload;

    var origin = req.get('origin');
    _payload.origin = origin;

    // CHECK TENANT IN DB IF EXISTS
    let user = await userService.createOrUpdateUser(_payload);

    res.status(200).json({ user });
  }).catch((err) => {
    return res.status(422).json({
      name: "AuthorizationError",
      message: err
    });
  });
});

module.exports = router;
