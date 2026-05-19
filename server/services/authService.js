const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");
const DEFAULT_SETTINGS = require("../config/defaultSettings");
const { updateUsers, readUsers, findUser } = require("../models/userStore");
const { normalizeUser } = require("../models/userNormalizers");
const AppError = require("../utils/AppError");
const { normalizeEmail } = require("../utils/validators");

function publicUser(user) {
  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;
  return userWithoutPassword;
}

function signToken(user) {
  return jwt.sign(
    { email: user.email, tokenVersion: Number(user.tokenVersion || 0) },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

async function register({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

  await updateUsers(async (users) => {
    if (findUser(users, normalizedEmail))
      throw new AppError("User already exists", 400);
    users.push(
      normalizeUser({
        email: normalizedEmail,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        settings: DEFAULT_SETTINGS,
        urls: [],
      }),
    );
  });

  return { msg: "User registered successfully" };
}

async function login({ email, password }) {
  const users = await readUsers();
  const user = findUser(users, normalizeEmail(email));
  if (!user) throw new AppError("Invalid email or password", 400);

  const valid = await bcrypt.compare(password || "", user.password);
  if (!valid) throw new AppError("Invalid email or password", 400);

  return { token: signToken(user), user: publicUser(user) };
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
  authorizeToken,
  changePassword,
  deleteAccount,
};
