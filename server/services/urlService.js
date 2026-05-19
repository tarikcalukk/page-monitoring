const DEFAULT_SETTINGS = require("../config/defaultSettings");
const {
  readUsers,
  updateUsers,
  findUser,
  findUrl,
} = require("../models/userStore");
const { normalizeUrl } = require("../models/userNormalizers");
const { emptyMethod } = require("../utils/metrics");
const AppError = require("../utils/AppError");
const { normalizePreferredMethod } = require("../utils/validators");
const contentFetchService = require("./contentFetchService");
const contentAnalysisService = require("./contentAnalysisService");
const browserService = require("./browserService");

async function validateReachableUrl(url) {
  try {
    const response = await contentFetchService.checkReachability(url);
    if (
      (response.status >= 200 && response.status < 400) ||
      response.status === 403
    ) {
      return { msg: "URL is reachable" };
    }
    throw new AppError(`Server responded with status: ${response.status}`, 400);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("The URL is unreachable or invalid.", 400);
  }
}

async function saveUrl(email, url) {
  const saved = await updateUsers(async (users) => {
    const user = findUser(users, email);
    if (!user) throw new AppError("User not found", 404);
    if (findUrl(user, url)) throw new AppError("URL already exists.", 400);

    const newUrl = normalizeUrl({
      url,
      active: false,
      changes: { total: 0, lastDetectedMethod: null },
      lastUpdated: null,
      methods: { HASH: emptyMethod(), DOM: emptyMethod() },
    });
    user.urls.push(newUrl);
    return newUrl;
  });

  return { msg: "URL saved successfully.", url: saved };
}

async function getUrls(email) {
  const users = await readUsers();
  const user = findUser(users, email);
  if (!user) throw new AppError("User not found", 404);
  return user.urls;
}

async function fetchContent(url) {
  const html = await contentFetchService.fetchRenderedHtml(url);
  const hash = contentAnalysisService.analyzeHash(html);
  const domStats = contentAnalysisService.analyzeDom(html);
  return { hash: hash.hash, hashStats: hash, domStats };
}

async function deleteUrl(email, url) {
  await updateUsers(async (users) => {
    const user = findUser(users, email);
    if (!user) throw new AppError("User not found", 404);
    const index = user.urls.findIndex((item) => item.url === url);
    if (index < 0) throw new AppError("URL not found.", 404);
    user.urls.splice(index, 1);
  });
  await browserService.closeRenderedPage(
    browserService.renderedPageKey(email, url),
  );
  return { msg: "URL deleted successfully." };
}

async function getChanges(email, url) {
  const users = await readUsers();
  const user = findUser(users, email);
  if (!user) throw new AppError("User not found", 404);
  const urlObj = findUrl(user, url);
  if (!urlObj) throw new AppError("URL not found.", 404);
  return {
    changes: urlObj.changes.total,
    lastDetectedMethod: urlObj.changes.lastDetectedMethod,
  };
}

async function getChangeHistory(email, url, method) {
  const users = await readUsers();
  const user = findUser(users, email);
  if (!user) throw new AppError("User not found", 404);
  const urlObj = findUrl(user, url);
  if (!urlObj) throw new AppError("URL not found.", 404);
  return { history: urlObj.methods[method].history };
}

async function setUrlActive(email, url, active) {
  const updated = await updateUsers(async (users) => {
    const user = findUser(users, email);
    if (!user) throw new AppError("User not found", 404);
    const urlObj = findUrl(user, url);
    if (!urlObj) throw new AppError("URL not found.", 404);
    urlObj.active = active;
    return urlObj;
  });

  if (!active)
    await browserService.closeRenderedPage(
      browserService.renderedPageKey(email, url),
    );
  return {
    msg: "URL active status updated.",
    url: updated.url,
    active: updated.active,
  };
}

async function getStatistics(email) {
  const users = await readUsers();
  const user = findUser(users, email);
  if (!user) throw new AppError("User not found", 404);

  return {
    dom: flattenUserHistory(user, "DOM"),
    hash: flattenUserHistory(user, "HASH"),
    urls: user.urls,
  };
}

function flattenUserHistory(user, method) {
  return user.urls.flatMap((urlObj) =>
    (urlObj.methods?.[method]?.history || []).map((entry) => ({
      ...entry,
      url: urlObj.url,
      method,
    })),
  );
}

async function getSettings(email) {
  const users = await readUsers();
  const user = findUser(users, email);
  if (!user) throw new AppError("User not found", 404);
  return { ...DEFAULT_SETTINGS, ...(user.settings || {}) };
}

async function saveSettings(email, settings) {
  await updateUsers(async (users) => {
    const user = findUser(users, email);
    if (!user) throw new AppError("User not found", 404);
    const nextSettings = { ...settings };
    if (nextSettings.preferredMethod) {
      nextSettings.preferredMethod = normalizePreferredMethod(
        nextSettings.preferredMethod,
      );
    }
    user.settings = {
      ...DEFAULT_SETTINGS,
      ...(user.settings || {}),
      ...nextSettings,
    };
  });
  return { msg: "Settings saved." };
}

module.exports = {
  validateReachableUrl,
  saveUrl,
  getUrls,
  fetchContent,
  deleteUrl,
  getChanges,
  getChangeHistory,
  setUrlActive,
  getStatistics,
  getSettings,
  saveSettings,
};
