const puppeteer = require("puppeteer");
const config = require("../config");
const logger = require("../utils/logger");

let browserPromise = null;
const renderedPages = new Map();

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--ignore-certificate-errors",
      ],
    });
  }
  return browserPromise;
}

async function fetchRenderedHtml(url, fallbackFetchHtml) {
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (compatible; PageMonitor/1.0)");
    await page.setCacheEnabled(false);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 1200)),
    );
    return await page.content();
  } catch (err) {
    logger.warn(
      { err, url },
      "Rendered fetch failed, falling back to static HTML",
    );
    return fallbackFetchHtml(url);
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

function renderedPageKey(email, url) {
  return `${email}::${url}`;
}

async function closeRenderedPage(key) {
  const cached = renderedPages.get(key);
  renderedPages.delete(key);
  if (cached?.page) await cached.page.close().catch(() => {});
}

async function getLiveRenderedPage(key, url) {
  const cached = renderedPages.get(key);
  if (cached?.page && !cached.page.isClosed()) {
    return cached.page;
  }

  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (compatible; PageMonitor/1.0)");
  await page.setCacheEnabled(false);
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  await page.evaluate(
    () => new Promise((resolve) => setTimeout(resolve, 1200)),
  );
  renderedPages.set(key, { page, url, lastUsed: Date.now() });
  return page;
}

async function fetchLiveRenderedHtml(key, url) {
  try {
    const page = await getLiveRenderedPage(key, url);
    const html = await page.content();
    const cached = renderedPages.get(key);
    if (cached) cached.lastUsed = Date.now();
    return html;
  } catch (err) {
    await closeRenderedPage(key);
    logger.warn({ err, url }, "Live rendered fetch failed, retrying once");
    const page = await getLiveRenderedPage(key, url);
    return page.content();
  }
}

async function closeInactiveRenderedPages() {
  const cutoff = Date.now() - config.monitoring.renderedPageTtlMs;
  const staleKeys = [...renderedPages.entries()]
    .filter(([, cached]) => !cached.lastUsed || cached.lastUsed < cutoff)
    .map(([key]) => key);

  await Promise.all(staleKeys.map((key) => closeRenderedPage(key)));
}

async function closeAllRenderedPages() {
  await Promise.all(
    [...renderedPages.keys()].map((key) => closeRenderedPage(key)),
  );
}

async function shutdownBrowser() {
  await closeAllRenderedPages();
  if (!browserPromise) return;

  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  if (browser) await browser.close().catch(() => {});
}

module.exports = {
  fetchRenderedHtml,
  renderedPageKey,
  fetchLiveRenderedHtml,
  closeRenderedPage,
  closeInactiveRenderedPages,
  shutdownBrowser,
};
