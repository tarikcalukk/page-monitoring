const config = require("../config");
const DEFAULT_SETTINGS = require("../config/defaultSettings");
const {
  readUsers,
  updateUsers,
  findUser,
  findUrl,
} = require("../models/userStore");
const { appendHistory } = require("../utils/metrics");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const browserService = require("./browserService");
const contentAnalysisService = require("./contentAnalysisService");

const runningChecks = new Set();
let monitoringTimer = null;
let cleanupTimer = null;

function methodEnabled(settings, method) {
  const preferred = settings.preferredMethod || "both";
  return preferred === "both" || preferred.toUpperCase() === method;
}

async function checkUrlForUser(email, urlValue) {
  const usersSnapshot = await readUsers();
  const userSnapshot = findUser(usersSnapshot, email);
  if (!userSnapshot) throw new AppError("User not found", 404);

  const urlSnapshot = findUrl(userSnapshot, urlValue);
  if (!urlSnapshot) throw new AppError("URL not found", 404);

  const settings = { ...DEFAULT_SETTINGS, ...(userSnapshot.settings || {}) };
  if (settings.monitoringPaused || !urlSnapshot.active) return urlSnapshot;

  const key = browserService.renderedPageKey(email, urlValue);
  try {
    const html = await browserService.fetchLiveRenderedHtml(
      key,
      urlSnapshot.url,
    );
    const hashStats = methodEnabled(settings, "HASH")
      ? contentAnalysisService.analyzeHash(html)
      : null;
    const domStats = methodEnabled(settings, "DOM")
      ? contentAnalysisService.analyzeDom(html)
      : null;
    const checkedAt = new Date().toISOString();

    return updateUsers(async (users) => {
      const user = findUser(users, email);
      if (!user) throw new AppError("User not found", 404);

      const urlObj = findUrl(user, urlValue);
      if (!urlObj) throw new AppError("URL not found", 404);
      if (!urlObj.active) return urlObj;

      const changedMethods = [];
      const domTypes = [];

      if (hashStats) {
        const previousHash =
          urlObj.methods.HASH.history[urlObj.methods.HASH.history.length - 1];
        const changed = Boolean(
          previousHash && previousHash.hash !== hashStats.hash,
        );
        const entry = {
          time: checkedAt,
          timeMs: hashStats.timeMs,
          cpu: hashStats.cpu,
          memoryMb: hashStats.memoryMb,
          hash: hashStats.hash,
          changed,
          changeTypes: previousHash
            ? changed
              ? ["CONTENT"]
              : []
            : ["INITIAL"],
        };
        appendHistory(urlObj.methods.HASH, entry, settings.logRetentionDays);
        if (changed) changedMethods.push("HASH");
      }

      if (domStats) {
        const previousDom =
          urlObj.methods.DOM.history[urlObj.methods.DOM.history.length - 1];
        const changeTypes = contentAnalysisService.classifyDomChange(
          previousDom,
          domStats,
        );
        const changed = Boolean(previousDom && changeTypes.length > 0);
        const entry = {
          time: checkedAt,
          timeMs: domStats.timeMs,
          cpu: domStats.cpu,
          memoryMb: domStats.memoryMb,
          elementCount: domStats.elementCount,
          maxDepth: domStats.maxDepth,
          attributeCount: domStats.attributeCount,
          _textContent: domStats._textContent,
          fingerprint: domStats.fingerprint,
          styleFingerprint: domStats.styleFingerprint,
          changed,
          changeTypes,
        };
        appendHistory(urlObj.methods.DOM, entry, settings.logRetentionDays);
        if (changed) {
          changedMethods.push("DOM");
          domTypes.push(...changeTypes);
        }
      }

      urlObj.lastChecked = checkedAt;
      urlObj.lastError = null;
      if (changedMethods.length > 0) {
        urlObj.changes.total = Number(urlObj.changes.total || 0) + 1;
        urlObj.changes.lastDetectedMethod = changedMethods.join("+");
        urlObj.changes.lastChangeTypes =
          [...new Set(domTypes)].join("+") || "CONTENT";
        urlObj.lastUpdated = checkedAt;
      }

      return urlObj;
    });
  } catch (err) {
    await browserService.closeRenderedPage(key);
    const checkedAt = new Date().toISOString();
    return updateUsers(async (users) => {
      const user = findUser(users, email);
      if (!user) throw new AppError("User not found", 404);
      const urlObj = findUrl(user, urlValue);
      if (!urlObj) throw new AppError("URL not found", 404);
      urlObj.lastChecked = checkedAt;
      urlObj.lastError = err.message || "Monitoring failed";
      return urlObj;
    });
  }
}

async function runMonitoringTick() {
  try {
    const users = await readUsers();
    const tasks = [];
    const now = Date.now();

    for (const user of users) {
      const settings = { ...DEFAULT_SETTINGS, ...(user.settings || {}) };
      if (settings.monitoringPaused) continue;

      const requestedIntervalMs =
        Math.max(1, Number(settings.monitoringInterval || 1)) * 1000;
      const intervalMs =
        requestedIntervalMs <= 1000
          ? 500
          : Math.max(1000, requestedIntervalMs - 250);
      for (const urlObj of user.urls) {
        if (!urlObj.active) continue;

        const lastChecked = urlObj.lastChecked
          ? new Date(urlObj.lastChecked).getTime()
          : 0;
        if (!lastChecked || now - lastChecked >= intervalMs) {
          const key = `${user.email}::${urlObj.url}`;
          if (runningChecks.has(key)) continue;

          runningChecks.add(key);
          tasks.push(
            checkUrlForUser(user.email, urlObj.url).finally(() => {
              runningChecks.delete(key);
            }),
          );
        }
      }
    }

    await Promise.allSettled(tasks);
  } catch (err) {
    logger.error({ err }, "Monitoring service error");
  }
}

function startMonitoringScheduler() {
  if (monitoringTimer) return;

  monitoringTimer = setInterval(runMonitoringTick, config.monitoring.tickMs);
  cleanupTimer = setInterval(
    browserService.closeInactiveRenderedPages,
    60 * 1000,
  );
}

async function shutdownMonitoring() {
  if (monitoringTimer) clearInterval(monitoringTimer);
  if (cleanupTimer) clearInterval(cleanupTimer);
  monitoringTimer = null;
  cleanupTimer = null;
  await browserService.shutdownBrowser();
}

module.exports = {
  startMonitoringScheduler,
  shutdownMonitoring,
  checkUrlForUser,
  runMonitoringTick,
};
