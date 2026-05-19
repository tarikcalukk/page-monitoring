const pino = require("pino");
const config = require("../config");

module.exports = pino({
  level: config.logLevel,
  redact: {
    paths: [
      "req.headers.authorization",
      "authorization",
      "password",
      "currentPassword",
      "newPassword",
      "EMAIL_PASS",
      "JWT_SECRET",
    ],
    remove: true,
  },
});
