var express = require('express');
var router = express.Router();

// Services
const tenantService = require("../services/tenant-service");

// Utils
const validationUtils = require("../utils/validation-utils");

router.post('/', function(req, res, next) {
  validationUtils.validateOrReject(req.body, {
    issuer: { type: "string", required: true },
    subject: { type: "string", required: true },
    audience: { type: "string", required: true },
    name: { type: "string", required: true }
  }).then(async (payload) => {
    let _payload = payload;

    // CHECK TENANT IN DB IF EXISTS
    let tenant = await tenantService.createTenant(_payload);

    res.status(200).json({ tenant });
  }).catch((err) => {
    return res.status(422).json({
      name: "AuthorizationError",
      message: err
    });
  });
});

module.exports = router;
