const nodemailer = require("nodemailer");
const config = require("../config");
const logger = require("../utils/logger");

const outbox = [];
let transporterPromise;

function createTransporter() {
  if (config.email.deliveryMode === "memory") return null;
  if (config.email.deliveryMode === "console") return null;

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth:
      config.email.user && config.email.pass
        ? { user: config.email.user, pass: config.email.pass }
        : undefined,
  });
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(createTransporter());
  }
  return transporterPromise;
}

function buildVerificationMessage(email, code) {
  return {
    from: config.email.from || "Page Monitoring <no-reply@page-monitoring.local>",
    to: email,
    subject: "Page Monitoring verification code",
    text: [
      "Your Page Monitoring verification code is:",
      "",
      code,
      "",
      `This code expires in ${config.email.verificationCodeTtlMinutes} minutes.`,
      "If you did not create this account, you can ignore this message.",
    ].join("\n"),
    html: `
      <p>Your Page Monitoring verification code is:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p>
      <p>This code expires in ${config.email.verificationCodeTtlMinutes} minutes.</p>
      <p>If you did not create this account, you can ignore this message.</p>
    `,
  };
}

async function sendVerificationCode(email, code) {
  const message = buildVerificationMessage(email, code);
  return sendMail(message, { code });
}

async function sendMail(message, metadata = {}) {
  if (config.email.deliveryMode === "memory") {
    outbox.push({ ...message, ...metadata, sentAt: new Date().toISOString() });
    return { delivered: true, mode: "memory" };
  }

  if (config.email.deliveryMode === "console") {
    logger.info(
      { to: message.to, ...metadata },
      "Email generated in console delivery mode.",
    );
    return { delivered: true, mode: "console" };
  }

  const transporter = await getTransporter();
  await transporter.sendMail(message);
  return { delivered: true, mode: deliveryModeLabel() };
}

function deliveryModeLabel() {
  if (config.email.host === "mailpit") return "mailpit";
  if (config.email.host) return "smtp";
  return config.email.deliveryMode;
}

function getOutbox() {
  return [...outbox];
}

function clearOutbox() {
  outbox.splice(0, outbox.length);
}

module.exports = {
  sendMail,
  sendVerificationCode,
  getOutbox,
  clearOutbox,
};
