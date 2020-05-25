'use strict';

// Schemas
let Tenant = require("../schemas/tenant");

// Vendor
const crypto = require("../vendor/crypto");

module.exports = {
  getTenant: async (payload) => {
    let tenant = await Tenant.findOne(payload);
    if (tenant == null) {
      return Promise.reject("invalid metadata");
    }

    return tenant;
  },
  createTenant: async (payload) => {
    let tenant = await Tenant.findOne(payload);
    if (tenant == null) {
      tenant = await Tenant.create({
        issuer: payload.issuer,
        subject: payload.subject,
        audience: payload.audience,
        name: payload.name,
        secret_key: crypto.generateRandomBytes()
      });
    }

    return tenant;
  },
};
