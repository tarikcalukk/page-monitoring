const crypto = require("crypto");
const path = require("path");

require("dotenv").config();

const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";
const configuredJwtSecret =
  process.env.JWT_SECRET && process.env.JWT_SECRET.trim();

if (isProduction && !configuredJwtSecret) {
  throw new Error("JWT_SECRET must be set in production.");
}

const dataFile = process.env.DATA_FILE
  ? path.resolve(process.cwd(), process.env.DATA_FILE)
  : path.resolve(__dirname, "..", "users.json");

module.exports = {
  env,
  isProduction,
  port: Number(process.env.PORT || 5000),
  jsonLimit: process.env.JSON_LIMIT || "1mb",
  allowedOrigins: (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: configuredJwtSecret || crypto.randomBytes(64).toString("hex"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  usingEphemeralJwtSecret: !configuredJwtSecret,
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
  dataFile,
  logLevel: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  email: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
  monitoring: {
    tickMs: Number(process.env.MONITORING_TICK_MS || 500),
    renderedPageTtlMs: Number(
      process.env.RENDERED_PAGE_TTL_MS || 15 * 60 * 1000,
    ),
  },
};
