const crypto = require("crypto");
const path = require("path");

require("dotenv").config();

const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";
const emailDeliveryMode =
  process.env.EMAIL_DELIVERY_MODE || (isProduction ? "smtp" : "console");
const configuredJwtSecret =
  process.env.JWT_SECRET && process.env.JWT_SECRET.trim();

if (isProduction && !configuredJwtSecret) {
  throw new Error("JWT_SECRET must be set in production.");
}

if (
  isProduction &&
  emailDeliveryMode === "smtp" &&
  (!process.env.EMAIL_HOST || !process.env.EMAIL_FROM)
) {
  throw new Error("EMAIL_HOST and EMAIL_FROM must be set in production.");
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
    deliveryMode: emailDeliveryMode,
    host: process.env.EMAIL_HOST || "",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === "true",
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "",
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    verificationCodeTtlMinutes: Number(
      process.env.EMAIL_VERIFICATION_CODE_TTL_MINUTES || 10,
    ),
    resendCooldownSeconds: Number(
      process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS || 60,
    ),
  },
  monitoring: {
    tickMs: Number(process.env.MONITORING_TICK_MS || 500),
    renderedPageTtlMs: Number(
      process.env.RENDERED_PAGE_TTL_MS || 15 * 60 * 1000,
    ),
  },
};
