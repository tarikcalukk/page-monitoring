const fs = require("fs/promises");
const path = require("path");
const config = require("../config");
const AppError = require("../utils/AppError");
const { normalizeUser } = require("./userNormalizers");

let dataQueue = Promise.resolve();

async function readUsers() {
  try {
    const content = await fs.readFile(config.dataFile, "utf8");
    const cleaned = content.replace(/^\uFEFF/, "").trim();
    const parsed = JSON.parse(cleaned || "[]");
    const users = Array.isArray(parsed) ? parsed : [parsed];
    return users.map(normalizeUser);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    if (err instanceof SyntaxError) {
      throw new AppError("User data file is corrupted.", 500);
    }
    throw err;
  }
}

async function writeUsers(users) {
  await fs.mkdir(path.dirname(config.dataFile), { recursive: true });
  const tempFile = `${config.dataFile}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempFile, `${JSON.stringify(users, null, 2)}\n`, "utf8");
  await replaceDataFile(tempFile);
}

async function updateUsers(mutator) {
  const operation = dataQueue.then(async () => {
    const users = await readUsers();
    const result = await mutator(users);
    await writeUsers(users);
    return result;
  });

  dataQueue = operation.catch(() => {});
  return operation;
}

function isRetriableReplaceError(err) {
  return ["EPERM", "EACCES", "EEXIST"].includes(err.code);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function replaceDataFile(tempFile) {
  let lastError;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await fs.rename(tempFile, config.dataFile);
      return;
    } catch (err) {
      lastError = err;
      if (!isRetriableReplaceError(err)) throw err;
      await wait(50 * (attempt + 1));
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await fs.rm(config.dataFile, { force: true });
      await fs.rename(tempFile, config.dataFile);
      return;
    } catch (err) {
      lastError = err;
      if (!isRetriableReplaceError(err)) throw err;
      await wait(75 * (attempt + 1));
    }
  }

  throw lastError;
}

function findUser(users, email) {
  return users.find(
    (user) => user.email.toLowerCase() === String(email || "").toLowerCase(),
  );
}

function findUrl(user, url) {
  return user.urls.find((item) => item.url === url);
}

module.exports = {
  readUsers,
  writeUsers,
  updateUsers,
  findUser,
  findUrl,
};
