const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config");
const DEFAULT_SETTINGS = require("../config/defaultSettings");
const { updateUsers, readUsers, findUser } = require("../models/userStore");
const { normalizeUser } = require("../models/userNormalizers");
const AppError = require("../utils/AppError");
const { normalizeEmail } = require("../utils/validators");
const mailService = require("./mailService");

const MAX_VERIFICATION_ATTEMPTS = 5;

function publicUser(user) {
  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;
  delete userWithoutPassword.emailVerification;
  return userWithoutPassword;
}

function signToken(user) {
  return jwt.sign(
    { email: user.email, tokenVersion: Number(user.tokenVersion || 0) },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

function generateVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function verificationExpiresAt() {
  return new Date(
    Date.now() + config.email.verificationCodeTtlMinutes * 60 * 1000,
  ).toISOString();
}

async function createVerificationState(code) {
  return {
    codeHash: await bcrypt.hash(code, config.bcryptRounds),
    expiresAt: verificationExpiresAt(),
    attempts: 0,
    lastSentAt: new Date().toISOString(),
  };
}

function devCodePayload(code) {
  if (!config.isProduction && config.email.deliveryMode === "console") {
    return { devVerificationCode: code };
  }
  return {};
}

async function register({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);
  const verificationCode = generateVerificationCode();
  const emailVerification = await createVerificationState(verificationCode);

  await updateUsers(async (users) => {
    if (findUser(users, normalizedEmail))
      throw new AppError("User already exists", 400);
    users.push(
      normalizeUser({
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: false,
        emailVerifiedAt: null,
        emailVerification,
        createdAt: new Date().toISOString(),
        settings: DEFAULT_SETTINGS,
        urls: [],
      }),
    );
  });

  await mailService.sendVerificationCode(normalizedEmail, verificationCode);

  return {
    msg: "User registered successfully. Verification code sent.",
    email: normalizedEmail,
    emailVerificationRequired: true,
    ...devCodePayload(verificationCode),
  };
}

async function login({ email, password }) {
  const users = await readUsers();
  const user = findUser(users, normalizeEmail(email));
  if (!user) throw new AppError("Invalid email or password", 400);

  const valid = await bcrypt.compare(password || "", user.password);
  if (!valid) throw new AppError("Invalid email or password", 400);
  if (!user.emailVerified) {
    throw new AppError("Email verification required", 403, {
      needsEmailVerification: true,
      email: user.email,
    });
  }

  return { token: signToken(user), user: publicUser(user) };
}

async function verifyEmail({ email, code }) {
  const normalizedEmail = normalizeEmail(email);
  let verifiedUser;
  let verificationError = null;

  await updateUsers(async (users) => {
    const user = findUser(users, normalizedEmail);
    if (!user) throw new AppError("User not found", 404);
    if (user.emailVerified) {
      verifiedUser = user;
      return;
    }

    const verification = user.emailVerification;
    if (!verification?.codeHash || !verification?.expiresAt) {
      throw new AppError("Verification code is not available.", 400);
    }
    if (new Date(verification.expiresAt).getTime() < Date.now()) {
      throw new AppError("Verification code has expired.", 400);
    }
    if (Number(verification.attempts || 0) >= MAX_VERIFICATION_ATTEMPTS) {
      throw new AppError("Too many invalid verification attempts.", 429);
    }

    const validCode = await bcrypt.compare(String(code || ""), verification.codeHash);
    if (!validCode) {
      verification.attempts = Number(verification.attempts || 0) + 1;
      verificationError = new AppError("Invalid verification code.", 400);
      return;
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date().toISOString();
    user.emailVerification = null;
    verifiedUser = user;
  });

  if (verificationError) throw verificationError;

  return {
    msg: "Email verified successfully.",
    token: signToken(verifiedUser),
    user: publicUser(verifiedUser),
  };
}

async function resendVerificationCode({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const verificationCode = generateVerificationCode();
  const nextVerification = await createVerificationState(verificationCode);

  await updateUsers(async (users) => {
    const user = findUser(users, normalizedEmail);
    if (!user) throw new AppError("User not found", 404);
    if (user.emailVerified) throw new AppError("Email is already verified.", 400);

    const lastSentAt = user.emailVerification?.lastSentAt
      ? new Date(user.emailVerification.lastSentAt).getTime()
      : 0;
    const cooldownMs = config.email.resendCooldownSeconds * 1000;
    if (lastSentAt && Date.now() - lastSentAt < cooldownMs) {
      throw new AppError("Please wait before requesting another code.", 429);
    }

    user.emailVerification = nextVerification;
  });

  await mailService.sendVerificationCode(normalizedEmail, verificationCode);

  return {
    msg: "Verification code sent.",
    email: normalizedEmail,
    ...devCodePayload(verificationCode),
  };
}

async function authorizeToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const users = await readUsers();
    const user = findUser(users, decoded.email);
    if (!user) throw new AppError("User not found", 404);
    if (Number(decoded.tokenVersion || 0) !== Number(user.tokenVersion || 0)) {
      throw new AppError("Session expired", 401);
    }
    return user;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Invalid token", 401);
  }
}

async function changePassword(email, currentPassword, newPassword) {
  await updateUsers(async (users) => {
    const user = findUser(users, email);
    if (!user) throw new AppError("User not found", 404);

    const validCurrent = await bcrypt.compare(
      currentPassword || "",
      user.password,
    );
    if (!validCurrent) throw new AppError("Current password is incorrect", 400);

    user.password = await bcrypt.hash(newPassword, config.bcryptRounds);
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  });

  return { msg: "Password changed successfully" };
}

async function deleteAccount(email) {
  await updateUsers(async (users) => {
    const index = users.findIndex((user) => user.email === email);
    if (index >= 0) users.splice(index, 1);
  });

  return { msg: "Account deleted successfully" };
}

module.exports = {
  publicUser,
  register,
  login,
  verifyEmail,
  resendVerificationCode,
  authorizeToken,
  changePassword,
  deleteAccount,
};
