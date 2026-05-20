const DEFAULT_SETTINGS = require("../config/defaultSettings");
const { emptyMethod, recomputeMethodTotals } = require("../utils/metrics");
const { normalizeEmail } = require("../utils/validators");

function normalizeUser(user) {
  return {
    ...user,
    email: normalizeEmail(user.email),
    emailVerified: user.emailVerified === undefined ? true : Boolean(user.emailVerified),
    emailVerifiedAt: user.emailVerifiedAt || null,
    emailVerification: user.emailVerification || null,
    tokenVersion: Number(user.tokenVersion || 0),
    createdAt: user.createdAt || new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS, ...(user.settings || {}) },
    urls: Array.isArray(user.urls) ? user.urls.map(normalizeUrl) : [],
  };
}

function normalizeUrl(urlObj) {
  const methods = urlObj.methods || {};
  const normalized = {
    ...urlObj,
    active: Boolean(urlObj.active),
    changes: {
      total: Number(urlObj.changes?.total ?? urlObj.changesTotal ?? 0),
      lastDetectedMethod:
        urlObj.changes?.lastDetectedMethod || urlObj.lastDetectedMethod || null,
      lastChangeTypes: urlObj.changes?.lastChangeTypes || null,
    },
    lastUpdated: urlObj.lastUpdated || null,
    lastChecked: urlObj.lastChecked || null,
    lastError: urlObj.lastError || null,
    methods: {
      HASH: { ...emptyMethod(), ...(methods.HASH || {}) },
      DOM: { ...emptyMethod(), ...(methods.DOM || {}) },
    },
  };

  normalized.methods.HASH.history = Array.isArray(
    normalized.methods.HASH.history,
  )
    ? normalized.methods.HASH.history
    : [];
  normalized.methods.DOM.history = Array.isArray(normalized.methods.DOM.history)
    ? normalized.methods.DOM.history
    : [];
  recomputeMethodTotals(normalized.methods.HASH);
  recomputeMethodTotals(normalized.methods.DOM);
  return normalized;
}

module.exports = {
  normalizeUser,
  normalizeUrl,
};
