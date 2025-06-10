const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const https = require("https");
const cheerio = require("cheerio");
const crypto = require("crypto");
const fetch = require("node-fetch"); 
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = path.join(__dirname, "users.json");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined in .env file");
  process.exit(1);
}

function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    const raw = fs.readFileSync(USERS_FILE);
    return JSON.parse(raw);
  }
  return [];
}
function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function authorizeUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw { status: 401, msg: "No token provided." };
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = loadUsers();
    const user = users.find((u) => u.email === decoded.email);

    if (!user) {
      throw { status: 404, msg: "User not found." };
    }

    return user;
  } catch (err) {
    throw { status: 401, msg: "Invalid token." };
  }
}

function recordChangeInternal({ urlObj, method, stats, domStats = null }) {
  if (!urlObj.changes) urlObj.changes = { total: 0, lastDetectedMethod: null };
  urlObj.changes.total += 1;
  urlObj.changes.lastDetectedMethod = method;
  urlObj.lastUpdated = new Date().toISOString();

  if (method === "HASH") {
    const hashMethod = urlObj.methods.HASH;
    hashMethod.history.push({
      time: urlObj.lastUpdated,
      timeMs: stats.lastTimeMs,
      cpu: stats.lastCpu,
      memoryMb: stats.lastMemoryMb,
      hash: stats.hash || ""
    });
    hashMethod.totalTimeMs += stats.lastTimeMs;
    hashMethod.totalCpu += stats.lastCpu;
    hashMethod.totalMemoryMb += stats.lastMemoryMb;
    const entryCount = hashMethod.history.length;
    hashMethod.avgTimeMs = hashMethod.totalTimeMs / entryCount;
    hashMethod.avgCpu = hashMethod.totalCpu / entryCount;
    hashMethod.avgMemoryMb = hashMethod.totalMemoryMb / entryCount;
  } else if (method === "DOM") {
    const domMethod = urlObj.methods.DOM;
    domMethod.history.push({
      time: urlObj.lastUpdated,
      timeMs: stats.lastTimeMs,
      cpu: stats.lastCpu,
      memoryMb: stats.lastMemoryMb,
      // ...samo statistike, BEZ textContent!
      elementCount: domStats.elementCount,
      maxDepth: domStats.maxDepth,
      attributeCount: domStats.attributeCount
    });
    domMethod.totalTimeMs += stats.lastTimeMs;
    domMethod.totalCpu += stats.lastCpu;
    domMethod.totalMemoryMb += stats.lastMemoryMb;
    const entryCount = domMethod.history.length;
    domMethod.avgTimeMs = domMethod.totalTimeMs / entryCount;
    domMethod.avgCpu = domMethod.totalCpu / entryCount;
    domMethod.avgMemoryMb = domMethod.totalMemoryMb / entryCount;
  }
}

let users = loadUsers();

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "Invalid email format" });
  }

  if (password.length < 8) {
    return res.status(400).json({ msg: "Password must be at least 8 characters long" });
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.status(400).json({ msg: "User already exists" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    users.push({ email, password: hashed, urls: [] });
    saveUsers(users);

    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
}); //radi

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ msg: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ msg: "Wrong password" });

  const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
}); // radi

app.get('/api/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ isValid: false, msg: 'No token provided' }); 
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ isValid: false, msg: 'Invalid token' }); 
    }

    res.json({ isValid: true, user: decoded }); 
  });
}); //radi

app.post("/api/change-password", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ msg: "Unauthorized" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = loadUsers();
    const user = users.find((u) => u.email === decoded.email);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const hashed = await bcrypt.hash(req.body.newPassword, 10);
    user.password = hashed;
    saveUsers(users);

    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
}); //radi

app.delete("/api/delete-account", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ msg: "Unauthorized" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    let usersList = loadUsers();
    const userIndex = usersList.findIndex((u) => u.email === decoded.email);

    if (userIndex === -1) return res.status(404).json({ msg: "User not found" });

    usersList.splice(userIndex, 1);

    users = usersList;
    saveUsers(users);

    res.json({ msg: "Account deleted successfully" });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(401).json({ msg: "Invalid token" });
  }
}); // radi

app.post("/api/validate-url", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ msg: "URL is required" });
  }

  try {
    const request = https.request(url, { method: "HEAD" }, (response) => {
      if (response.statusCode >= 200 && response.statusCode < 400) {
        res.status(200).json({ msg: "URL is reachable" });
      } else {
        res.status(response.statusCode).json({ msg: `Server responded with status: ${response.statusCode}` });
      }
    });

    request.on("error", () => {
      res.status(500).json({ msg: "The URL is unreachable or invalid." });
    });

    request.end();
  } catch (error) {
    res.status(500).json({ msg: "The URL is unreachable or invalid." });
  }
}); //radi


app.post("/api/save-url", (req, res) => {
  try {
    const user = authorizeUser(req);
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ msg: "URL is required." });
    }

    // Provjera da li URL već postoji
    const urlExists = user.urls.some(u => u.url === url);
    if (urlExists) {
      return res.status(400).json({ msg: "URL already exists." });
    }

    // Kreiranje novog URL entryja sa default vrijednostima
    const newUrlEntry = {
      url,
      active: false,
      changes: {
        total: 0,
        lastDetectedMethod: null
      },
      lastUpdated: null,
      methods: {
        HASH: {
          history: [],
          totalTimeMs: 0,
          avgTimeMs: 0,
          totalCpu: 0,
          avgCpu: 0,
          totalMemoryMb: 0,
          avgMemoryMb: 0
        },
        DOM: {
          history: [],
          totalTimeMs: 0,
          avgTimeMs: 0,
          totalCpu: 0,
          avgCpu: 0,
          totalMemoryMb: 0,
          avgMemoryMb: 0
        }
      }
    };

    user.urls.push(newUrlEntry);
    
    // Ažuriranje baze
    const users = loadUsers();
    const updatedUsers = users.map(u => u.email === user.email ? user : u);
    saveUsers(updatedUsers);

    res.json({ msg: "URL saved successfully.", url: newUrlEntry });
  } catch (err) {
    console.error("Error saving URL:", err);
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
}); //radi

app.get("/api/get-urls", (req, res) => {
  try {
    const user = authorizeUser(req);
    res.json(user.urls);
  } catch (err) {
    res.status(err.status || 500).json({ 
      error: true,
      message: err.msg || "Došlo je do greške na serveru"
    });
  }
}); //radi

app.post("/api/fetch-content", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ msg: "URL is required." });
  }

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Ukloni dinamičke elemente
    $('script, iframe, [id*="ad"], [class*="ad"], [src*="analytics"], [src*="doubleclick"], [src*="googletagmanager"]').remove();

    // Hashiraj samo <main> ako postoji, inače <body>
    const mainContent = $('main').length ? $('main').html() : $('body').html();
    const hash = crypto.createHash("sha256").update(mainContent || '').digest("hex");

    // DOM: izračunaj broj elemenata, dubinu i broj atributa
    function getDomDepth($, element, depth = 0) {
      const children = element.children();
      if (!children || children.length === 0) {
        return depth;
      }
      let maxDepth = depth;
      children.each((_, child) => {
        maxDepth = Math.max(maxDepth, getDomDepth($, $(child), depth + 1));
      });
      return maxDepth;
    }

    const domStats = {
      elementCount: $("*").length,
      maxDepth: getDomDepth($, $("body")),
      attributeCount: $("*").toArray().reduce((acc, el) => acc + Object.keys(el.attribs || {}).length, 0),
    };

    res.json({
      hash,
      domStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch page content." });
  }
}); //radi

app.delete("/api/delete-url", (req, res) => {
  try {
    const user = authorizeUser(req);
    const { url } = req.body;

    if (!url) return res.status(400).json({ msg: "URL is required." });

    user.urls = user.urls.filter((u) => u.url !== url);

    const users = loadUsers();
    const updatedUsers = users.map((u) => (u.email === user.email ? user : u));
    saveUsers(updatedUsers);

    res.json({ msg: "URL deleted successfully." });
  } catch (err) {
    console.error("Error deleting URL:", err);
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
}); //radi

app.get("/api/get-changes", (req, res) => {
  try {
    const user = authorizeUser(req);
    const { url } = req.query;

    if (!url) return res.status(400).json({ msg: "URL is required." });

    const urlObj = user.urls.find((u) => u.url === url);
    const changeCount = urlObj && urlObj.changes ? urlObj.changes.total : 0;
    const lastDetectedMethod = urlObj && urlObj.changes ? urlObj.changes.lastDetectedMethod : null;

    res.json({ changes: changeCount, lastDetectedMethod });
  } catch (err) {
    console.error("Error fetching changes:", err);
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
}); //radi

app.post("/api/increment-changes", (req, res) => {
  try {
    const user = authorizeUser(req);
    const { url, method, stats } = req.body;

    if (!url || !method || !stats) {
      return res.status(400).json({ msg: "URL, method, and stats are required." });
    }

    const urlObj = user.urls.find((u) => u.url === url);
    if (!urlObj) {
      return res.status(404).json({ msg: "URL not found." });
    }

    recordChangeInternal({ urlObj, method, stats });

    const users = loadUsers();
    const updatedUsers = users.map((u) => (u.email === user.email ? user : u));
    saveUsers(updatedUsers);

    res.json({ msg: "Change count incremented successfully.", changes: urlObj.changes.total });
  } catch (err) {
    console.error("Error incrementing changes:", err);
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
}); 

app.get("/api/get-change-history", (req, res) => {
  try {
    const user = authorizeUser(req);
    const { url, method } = req.query;

    if (!url || !method || (method !== "HASH" && method !== "DOM")) {
      return res.status(400).json({ msg: "URL and valid method (HASH or DOM) are required." });
    }

    const urlObj = user.urls.find((u) => u.url === url);
    if (!urlObj) {
      return res.status(404).json({ msg: "URL not found." });
    }

    const history = urlObj.methods[method]?.history || [];

    // Vraćamo history bez hash-a (za DOM je već bez hash-a, za HASH ga uklanjamo)
    const filteredHistory = history.map(entry => {
      const { hash, ...rest } = entry;
      return rest;
    });

    res.json({ history: filteredHistory });
  } catch (err) {
    console.error("Error fetching change history:", err);
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
}); //radi

app.post("/api/toggle-url-active", (req, res) => {
  try {
    const user = authorizeUser(req);
    const { url, active } = req.body;

    if (!url || typeof active !== "boolean") {
      return res.status(400).json({ msg: "URL and active(boolean) are required." });
    }

    const urlObj = user.urls.find(u => u.url === url);
    if (!urlObj) {
      return res.status(404).json({ msg: "URL not found." });
    }

    urlObj.active = active;

    const users = loadUsers();
    const updatedUsers = users.map(u => u.email === user.email ? user : u);
    saveUsers(updatedUsers);

    res.json({ msg: "URL active status updated.", url, active });
  } catch (err) {
    console.error("Error toggling URL active:", err);
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
});

// Backend monitoring servis
// ...postojeći kod...

setInterval(async () => {
  try {
    const users = loadUsers();
    let usersChanged = false;

    for (const user of users) {
      for (const urlObj of user.urls) {
        if (!urlObj.active) continue;

        try {
          // --- HASH (meri cijeli proces) ---
          const hashStart = Date.now();
          const hashStartCpu = process.cpuUsage();
          const hashStartMem = process.memoryUsage().heapUsed / 1024 / 1024;

          const response = await fetch(urlObj.url);
          const html = await response.text();
          const $hash = cheerio.load(html);

          $hash('script, iframe, [id*="ad"], [class*="ad"], [src*="analytics"], [src*="doubleclick"], [src*="googletagmanager"]').remove();

          const mainContent = $hash('main').length ? $hash('main').html() : $hash('body').html();
          const hash = crypto.createHash("sha256").update(mainContent || '').digest("hex");

          const hashEnd = Date.now();
          const hashEndCpu = process.cpuUsage(hashStartCpu);
          const hashEndMem = process.memoryUsage().heapUsed / 1024 / 1024;

          const hashStats = {
            lastTimeMs: hashEnd - hashStart,
            lastCpu: ((hashEndCpu.user + hashEndCpu.system) / 1000) / (hashEnd - hashStart) * 100 || 0,
            lastMemoryMb: Math.max(0, hashEndMem - hashStartMem),
            hash
          };

          // IGNORIŠI DETEKCIJU ako je bilo koji resurs 0
          if (
            hashStats.lastTimeMs === 0 ||
            hashStats.lastCpu === 0 ||
            hashStats.lastMemoryMb === 0
          ) {
            continue;
          }

          const hashMethod = urlObj.methods.HASH;
          const lastHashEntry = hashMethod.history.length > 0 ? hashMethod.history[hashMethod.history.length - 1] : null;
          if (!lastHashEntry || lastHashEntry.hash !== hash) {
            recordChangeInternal({ urlObj, method: "HASH", stats: hashStats });
            usersChanged = true;
          }

          // --- DOM (meri cijeli proces: fetch + parsiranje + statistika) ---
          const domStart = Date.now();
          const domStartCpu = process.cpuUsage();
          const domStartMem = process.memoryUsage().heapUsed / 1024 / 1024;

          const $dom = cheerio.load(html);
          $dom('script, iframe, [id*="ad"], [class*="ad"], [src*="analytics"], [src*="doubleclick"], [src*="googletagmanager"]').remove();

          function getDomDepth($, element, depth = 0) {
            const children = element.children();
            if (!children || children.length === 0) {
              return depth;
            }
            let maxDepth = depth;
            children.each((_, child) => {
              maxDepth = Math.max(maxDepth, getDomDepth($, $(child), depth + 1));
            });
            return maxDepth;
          }
          const domTextContent = $dom("main").length
            ? $dom("main").text().replace(/\s+/g, " ").trim()
            : $dom("body").text().replace(/\s+/g, " ").trim();

          const domStats = {
            elementCount: $dom("*").length,
            maxDepth: getDomDepth($dom, $dom("body")),
            attributeCount: $dom("*").toArray().reduce((acc, el) => acc + Object.keys(el.attribs || {}).length, 0)
          };

          const domEnd = Date.now();
          const domEndCpu = process.cpuUsage(domStartCpu);
          const domEndMem = process.memoryUsage().heapUsed / 1024 / 1024;

          const domPerfStats = {
            lastTimeMs: domEnd - domStart,
            lastCpu: ((domEndCpu.user + domEndCpu.system) / 1000) / (domEnd - domStart) * 100 || 0,
            lastMemoryMb: Math.max(0, domEndMem - domStartMem)
          };

          // IGNORIŠI DETEKCIJU ako je bilo koji resurs 0
          if (
            domPerfStats.lastTimeMs === 0 ||
            domPerfStats.lastCpu === 0 ||
            domPerfStats.lastMemoryMb === 0
          ) {
            continue;
          }

          const domMethod = urlObj.methods.DOM;
          const lastDomEntry = domMethod.history.length > 0 ? domMethod.history[domMethod.history.length - 1] : null;
          if (
            !lastDomEntry ||
            lastDomEntry._textContent !== domTextContent
          ) {
            recordChangeInternal({ urlObj, method: "DOM", stats: domPerfStats, domStats });
            domMethod.history[domMethod.history.length - 1]._textContent = domTextContent;
            usersChanged = true;
          }
        } catch (err) {
          console.error(`Monitoring error for ${urlObj.url}:`, err.message);
        }
      }
    }

    if (usersChanged) {
      saveUsers(users);
    }
  } catch (err) {
    console.error("Monitoring service error:", err.message);
  }
}, 5 * 1000);

app.get("/api/statistics", (req, res) => {
  const users = loadUsers();
  let dom = [], hash = [];
  for (const user of users) {
    for (const urlObj of user.urls || []) {
      if (urlObj.methods?.DOM?.history) dom = dom.concat(urlObj.methods.DOM.history);
      if (urlObj.methods?.HASH?.history) hash = hash.concat(urlObj.methods.HASH.history);
    }
  }
  res.json({ dom, hash });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));