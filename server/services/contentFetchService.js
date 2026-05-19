const http = require("http");
const https = require("https");
const fetch = require("node-fetch");
const browserService = require("./browserService");

function getFetchAgent(url) {
  if (
    url.startsWith("https://localhost") ||
    url.startsWith("https://127.0.0.1") ||
    url.startsWith("https://0.0.0.0")
  ) {
    return new https.Agent({ rejectUnauthorized: false });
  }
  if (
    url.startsWith("http://localhost") ||
    url.startsWith("http://127.0.0.1")
  ) {
    return new http.Agent();
  }
  return undefined;
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      agent: getFetchAgent(url),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PageMonitor/1.0)",
      },
    });

    if (!response.ok && response.status !== 403) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRenderedHtml(url) {
  return browserService.fetchRenderedHtml(url, fetchHtml);
}

async function checkReachability(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    let response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      agent: getFetchAgent(url),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PageMonitor/1.0)" },
    });

    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        agent: getFetchAgent(url),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PageMonitor/1.0)" },
      });
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  fetchHtml,
  fetchRenderedHtml,
  checkReachability,
};
