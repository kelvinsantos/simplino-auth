'use strict';
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Services
const authenticatorService = require("../services/authenticator-service");
const tenantService = require("../services/tenant-service");
const userService = require("../services/user-service");

// Utils
const validationUtils = require("../utils/validation-utils");

const ALGORITHM = "HS256";
const EXPIRES_IN = 7; // 7 days

router.post('/sign', function(req, res, next) {
  validationUtils.validateOrReject(req.body, {
    email: { type: "string", required: true },
    password: { type: "string", required: true }
  }).then(async payload => {
    let _payload = payload;

    var origin = req.get('origin');
    _payload.origin = origin;

    // CHECK USER IN DB IF EXISTS
    let user = await userService.getUser(_payload);

    // CHECK TENANT IN DB IF EXISTS
    let tenant = user.tenant;
    let secretKey = tenant.secret_key;

    // SIGNING PAYLOAD
    let signPayload = { user };

    // SIGNING OPTIONS
    let signOptions = {
      audience:  tenant.audience,
      subject:  tenant.subject,
      issuer:  origin,
      algorithm: ALGORITHM,
      expiresIn: `${EXPIRES_IN}d`
    };

    try {
      let token = await authenticatorService.sign(signPayload, secretKey, signOptions);

      // set the cookie as the token string, with a similar max age as the token
      // here, the max age is in milliseconds, so we multiply by 1000
      // res.cookie('token', token, { maxAge: signOptions.expiresIn * 1000 });
      // res.end();

      let tokenData = await authenticatorService.verify(token, secretKey, signOptions);

      return res.status(200).json({
        token: token,
        max_age: EXPIRES_IN,
        token_data: tokenData
      });
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        // if the error thrown is because the JWT is unauthorized, return a 401 error
        return res.status(401).end();
      }
    }
  }).catch((err) => {
    return res.status(422).json({
      name: "AuthorizationError",
      message: err
    });
  });
});

router.post('/verify', function(req, res, next) {
  validationUtils.validateOrReject(req.body, {
    token: { type: "string", required: false }
  }).then(async payload => {
    let _payload = payload;

    if (_payload.token == null) {
      // We can obtain the session token from the requests cookies, which come with every request
      _payload.token = req.cookies.token;
    }

    // if the cookie is not set, return an unauthorized error
    if (!_payload.token) {
      return res.status(401).end();
    }

    // decode token to get metadata
    let decodedToken = await authenticatorService.decode(_payload.token);

    let appMetadata;
    if (decodedToken) {
      appMetadata = {
        audience:  decodedToken.payload.aud,
        subject:  decodedToken.payload.sub,
        issuer:  decodedToken.payload.iss
      };
    }

    // CHECK TENANT IN DB IF EXISTS
    let tenant = await tenantService.getTenant(appMetadata);

    let secretKey = tenant.secret_key;

    try {
      let verifiedToken = await authenticatorService.verify(_payload.token, secretKey);
      return res.status(200).json(verifiedToken);
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        // if the error thrown is because the JWT is unauthorized, return a 401 error
        return res.status(401).end();
      }
    }
  }).catch((err) => {
    return res.status(422).json({
      name: "AuthorizationError",
      message: err
    });
  });
});

router.post('/refresh', function(req, res, next) {
  validationUtils.validateOrReject(req.body, {
    token: { type: "string", required: false }
  }).then(async payload => {
    let _payload = payload;

    if (_payload.token == null) {
      // We can obtain the session token from the header, which come with every request
      _payload.token = req.get("Token");
    }

    // if the cookie is not set, return an unauthorized error
    if (!_payload.token) {
      return res.status(401).end();
    }

    // decode token to get metadata
    let decodedToken = await authenticatorService.decode(_payload.token);

    let appMetadata;
    if (decodedToken) {
      appMetadata = {
        audience:  decodedToken.payload.aud,
        subject:  decodedToken.payload.sub,
        issuer:  decodedToken.payload.iss
      };
    }

    // CHECK TENANT IN DB IF EXISTS
    let tenant = await tenantService.getTenant(appMetadata);

    let secretKey = tenant.secret_key;

    try {
      await authenticatorService.verify(_payload.token, secretKey);
      return res.status(200).json({});
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        // We ensure that a new token is not issued until enough time has elapsed
        // In this case, a new token will only be issued if the old token is within
        // 2 hours / 7200 seconds of expiry. Otherwise, return a bad request status
        const nowUnixSeconds = Math.round(Number(new Date()) / 1000);
        if (decodedToken.payload.exp - nowUnixSeconds > 7200) {
          return res.status(400).end();
        }

        // PAYLOAD
        let signPayload = decodedToken.user;

        try {
          // SIGNING OPTIONS
          let signOptions = {
            audience:  appMetadata.audience,
            subject:  appMetadata.subject,
            issuer:  appMetadata.issuer,
            algorithm: ALGORITHM,
            expiresIn: `${EXPIRES_IN}d`
          };

          let newToken = await authenticatorService.sign(signPayload, secretKey, signOptions);
    
          // set the cookie as the token string, with a similar max age as the token
          // here, the max age is in milliseconds, so we multiply by 1000
          // res.cookie('token', newToken, { maxAge: signOptions.expiresIn * 1000 });
          // res.end();
    
          return res.status(200).json({
            token: newToken,
            max_age: EXPIRES_IN
          });
        } catch (err) {
          if (err instanceof jwt.JsonWebTokenError) {
            // if the error thrown is because the JWT is unauthorized, return a 401 error
            return res.status(401).end();
          }
        }
      }
      return res.status(400).end();
    }
  }).catch((err) => {
    return res.status(422).json({
      name: "AuthorizationError",
      message: err
    });
  });
});

router.post('/decode', function(req, res, next) {
  validationUtils.validateOrReject(req.body, {
    token: { type: "string", required: true }
  }).then(async payload => {
    let _payload = payload;

    try {
      let token = await authenticatorService.decode(_payload.token);
      res.status(200).json(token);
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        // if the error thrown is because the JWT is unauthorized, return a 401 error
        return res.status(401).end();
      }
    }
  }).catch((err) => {
    return res.status(422).json({
      name: "AuthorizationError",
      message: err
    });
  });
});

module.exports = router;
