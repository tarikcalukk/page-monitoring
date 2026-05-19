import { request } from "./httpClient";

export const apiService = {
  login(credentials) {
    return request("/api/login", {
      method: "POST",
      auth: false,
      body: credentials,
    });
  },

  register(payload) {
    return request("/api/register", {
      method: "POST",
      auth: false,
      body: payload,
    });
  },

  verifyToken() {
    return request("/api/verify");
  },

  changePassword(payload) {
    return request("/api/change-password", {
      method: "POST",
      body: payload,
    });
  },

  deleteAccount() {
    return request("/api/delete-account", {
      method: "DELETE",
    });
  },

  getUrls() {
    return request("/api/get-urls");
  },

  validateUrl(url) {
    return request("/api/validate-url", {
      method: "POST",
      auth: false,
      body: { url },
    });
  },

  saveUrl(url) {
    return request("/api/save-url", {
      method: "POST",
      body: { url },
    });
  },

  deleteUrl(url) {
    return request("/api/delete-url", {
      method: "DELETE",
      body: { url },
    });
  },

  toggleUrlActive(url, active) {
    return request("/api/toggle-url-active", {
      method: "POST",
      body: { url, active },
    });
  },

  sendReport() {
    return request("/api/send-report", {
      method: "POST",
    });
  },

  getSettings() {
    return request("/api/settings");
  },

  saveSettings(settings) {
    return request("/api/settings", {
      method: "POST",
      body: settings,
    });
  },

  getStatistics() {
    return request("/api/statistics");
  },

  exportCsv() {
    return request("/api/export-csv");
  },
};
