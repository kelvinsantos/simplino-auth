const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let tenantSchema = new Schema(
  {
    issuer: [String],
    subject: String,
    audience: String,
    name: String,
    secret_key: String,
    owner: { type: mongoose.Schema.ObjectId, ref: "User" },
    api_base_url: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Tenant", tenantSchema);
