'use strict';
const { get } = require("lodash");
const bcrypt = require("bcrypt");

// Schemas
let User = require("../schemas/user");
let Tenant = require("../schemas/tenant");

async function hashPassword(passwordString) {
  let saltRounds = 10;
  return await bcrypt.hash(passwordString, saltRounds);
}

module.exports = {
  getUser: async (payload) => {
    let email = payload.email.toLowerCase();
    let origin = payload.origin;
    let clearPassword = payload.password;

    if (!origin) {
      return Promise.reject("origin is required");
    }

    let tenant = await Tenant.findOne({ issuer: origin });

    if (!tenant) {
      return Promise.reject("no tenant found based on origin");
    }

    let user = await User.findOne({ "email": email, "tenant": tenant._id }).populate("tenant");
    if (user == null) {
      return Promise.reject("incorrect email or password");
    }

    let compareRes = await bcrypt.compare(clearPassword, user.password);
    if (compareRes == false) {
      return Promise.reject("incorrect email or password");
    }

    let hasTenant = get(user, "tenant");
    if (!hasTenant) {
      return Promise.reject("no tenant associated with the user");
    }

    return user;
  },
  createOrUpdateUser: async (payload) => {
    let origin = payload.origin;

    if (!origin) {
      return Promise.reject("origin is required");
    }

    let tenant = await Tenant.findOne({ issuer: origin });

    if (!tenant) {
      return Promise.reject("no tenant found based on origin");
    }

    let user = await User.findOne({ external_id: payload.external_id });
    if (user == null) {
      user = await User.create({
        email: payload.email,
        password: await hashPassword(payload.access),
        first_name: payload.first_name,
        last_name: payload.last_name,
        tenant: tenant._id,
        external_id: payload.external_id
      });
    } else {
      if (payload.email)
        user.email = payload.email;

      if (payload.access)
        user.password = await hashPassword(payload.access);

      if (payload.first_name)
        user.first_name = payload.first_name;

      if (payload.last_name)
        user.last_name = payload.last_name;

      user.tenant = tenant._id;
      user = await User.update({ external_id: payload.external_id }, { $set: user });
    }
    return user;
  }
};
