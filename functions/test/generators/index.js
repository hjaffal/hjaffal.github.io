/**
 * Central export for all fast-check generators.
 */
const email = require("./email");
const subscriber = require("./subscriber");
const post = require("./post");
const webhook = require("./webhook");

module.exports = {
  email,
  subscriber,
  post,
  webhook,
};
