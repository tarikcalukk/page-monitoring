const cheerio = require("cheerio");
const crypto = require("crypto");

function sanitizeDom($) {
  $(
    'script, iframe, noscript, [id*="ad"], [class*="ad"], [src*="analytics"], [src*="doubleclick"], [src*="googletagmanager"]',
  ).remove();
}

function getMainText($) {
  return ($("main").length ? $("main").text() : $("body").text())
    .replace(/\s+/g, " ")
    .trim();
}

function getDomDepth($, element, depth = 0) {
  const children = element.children();
  if (!children || children.length === 0) return depth;

  let maxDepth = depth;
  children.each((_, child) => {
    maxDepth = Math.max(maxDepth, getDomDepth($, $(child), depth + 1));
  });
  return maxDepth;
}

function getDomFingerprint($) {
  return $("*")
    .toArray()
    .map((el) => {
      const tag = el.name || "";
      const attrs = Object.entries(el.attribs || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
          ([key, value]) =>
            `${key}=${String(value).replace(/\s+/g, " ").trim()}`,
        )
        .join("|");
      return `${tag}:${attrs}`;
    })
    .join("||");
}

function getStyleFingerprint($) {
  return $("*")
    .toArray()
    .map((el) => ($(el).attr("style") || "").replace(/\s+/g, " ").trim())
    .join("|");
}

function stripIgnoredHtml(html) {
  return String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/\sdata-reactroot="[^"]*"/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHashSource(html) {
  const source = String(html || "");
  const mainMatch = source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) return stripIgnoredHtml(mainMatch[1]);

  const bodyMatch = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) return stripIgnoredHtml(bodyMatch[1]);

  return stripIgnoredHtml(source);
}

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function measureCpuPercent(cpuUsage, durationMs) {
  if (!durationMs) return 0;
  const cpuMs = (cpuUsage.user + cpuUsage.system) / 1000;
  const percent = (cpuMs / durationMs) * 100;
  return Number.isFinite(percent) && percent > 0 ? percent : 0;
}

function analyzeHash(html) {
  const startTime = process.hrtime.bigint();
  const startMem = process.memoryUsage().heapUsed / 1024 / 1024;
  const startCpu = process.cpuUsage();

  const hashSource = extractHashSource(html);
  const hash = crypto.createHash("sha256").update(hashSource).digest("hex");

  const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
  const memoryMb = Math.max(
    0,
    process.memoryUsage().heapUsed / 1024 / 1024 - startMem,
    Buffer.byteLength(hashSource, "utf8") / 1024 / 1024,
  );
  const cpu = measureCpuPercent(process.cpuUsage(startCpu), durationMs);

  return {
    hash,
    timeMs: round(durationMs),
    cpu: round(cpu),
    memoryMb: round(memoryMb),
  };
}

function analyzeDom(html) {
  const startTime = process.hrtime.bigint();
  const startMem = process.memoryUsage().heapUsed / 1024 / 1024;
  const startCpu = process.cpuUsage();

  const $ = cheerio.load(html);
  sanitizeDom($);
  const textContent = getMainText($);
  const domFingerprintSource = getDomFingerprint($);
  const styleFingerprintSource = getStyleFingerprint($);
  const fingerprint = crypto
    .createHash("sha256")
    .update(domFingerprintSource)
    .digest("hex");
  const styleFingerprint = crypto
    .createHash("sha256")
    .update(styleFingerprintSource)
    .digest("hex");
  const elementCount = $("*").length;
  const maxDepth = getDomDepth($, $("body"));
  const attributeCount = $("*")
    .toArray()
    .reduce((acc, el) => acc + Object.keys(el.attribs || {}).length, 0);

  const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
  const footprintMb =
    Buffer.byteLength(html, "utf8") / 1024 / 1024 +
    Buffer.byteLength(textContent, "utf8") / 1024 / 1024 +
    Buffer.byteLength(domFingerprintSource, "utf8") / 1024 / 1024 +
    Buffer.byteLength(styleFingerprintSource, "utf8") / 1024 / 1024;
  const memoryMb = Math.max(
    0,
    process.memoryUsage().heapUsed / 1024 / 1024 - startMem,
    footprintMb,
  );
  const cpu = measureCpuPercent(process.cpuUsage(startCpu), durationMs);

  return {
    timeMs: round(durationMs),
    cpu: round(cpu),
    memoryMb: round(memoryMb),
    elementCount,
    maxDepth,
    attributeCount,
    _textContent: textContent,
    fingerprint,
    styleFingerprint,
  };
}

function classifyDomChange(previous, current) {
  if (!previous) return ["INITIAL"];

  const types = [];
  if (previous._textContent !== current._textContent) types.push("TEXT");
  if (previous.fingerprint !== current.fingerprint) types.push("STRUCTURE");
  if (previous.styleFingerprint !== current.styleFingerprint)
    types.push("STYLE");
  if (
    previous.elementCount !== current.elementCount ||
    previous.maxDepth !== current.maxDepth ||
    previous.attributeCount !== current.attributeCount
  ) {
    if (!types.includes("STRUCTURE")) types.push("STRUCTURE");
  }
  return types;
}

module.exports = {
  analyzeHash,
  analyzeDom,
  classifyDomChange,
  extractHashSource,
};
