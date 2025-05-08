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

const JWT_SECRET = process.env.JWT_SECRET;
const USERS_FILE = path.join(__dirname, "users.json");

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

    users.push({ email, password: hashed, urls: [], logs: [] });
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

    if (!url) return res.status(400).json({ msg: "URL is required." });

    if (!user.urls.includes(url)) {
      user.urls.push(url);
    }

    const users = loadUsers();
    const updatedUsers = users.map((u) =>
      u.email === user.email ? user : u
    );
    saveUsers(updatedUsers);

    res.json({ msg: "URL saved successfully." });
  } catch (err) {
    console.error("Error saving URL:", err);
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
}); //radi

app.get("/api/get-urls", (req, res) => {
  try {
    const user = authorizeUser(req);

    const urls = user.urls.map((url) =>
      typeof url === "string"
        ? { url, active: true, trackingType: "DOM" }
        : url
    );

    res.json({ urls });
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
}); //radi

app.post("/api/fetch-content", async (req, res) => {
  const { url } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const fullHtml = $.html();
    const hash = crypto.createHash("sha256").update(fullHtml).digest("hex");

    res.json({
      hash: hash
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch page content." });
  }
}); //radi

app.post("/api/add-log", (req, res) => {
  try {
    const user = authorizeUser(req);
    const { url } = req.body;

    if (!url) return res.status(400).json({ msg: "URL is required." });

    const newLog = {
      url,
      message: "Change detected",
      date: new Date().toISOString(),
    };
    user.logs.push(newLog);

    const users = loadUsers();

    const updatedUsers = users.map((u) =>
      u.email === user.email ? user : u
    );

    saveUsers(updatedUsers);

    res.json({ msg: "Log added successfully." });
  } catch (err) {
    console.error("Error adding log:", err);
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
}); //radi

app.get("/api/logs", (req, res) => {
  try {
    const user = authorizeUser(req);
    res.json(user.logs || []);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
}); //radi

app.delete("/api/delete-url", (req, res) => {
  try {
    const user = authorizeUser(req);
    const { url } = req.body;

    if (!url) return res.status(400).json({ msg: "URL is required." });

    user.urls = user.urls.filter((u) => u !== url);

    const users = loadUsers();

    const updatedUsers = users.map((u) =>
      u.email === user.email ? user : u
    );

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

    const changeCount = user.changes?.[url] || 0;

    res.json({ changes: changeCount });
  } catch (err) {
    console.error("Error fetching changes:", err);
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
});

app.post("/api/increment-changes", (req, res) => {
  try {
    const user = authorizeUser(req);
    const { url } = req.body;

    if (!url) return res.status(400).json({ msg: "URL is required." });

    if (!user.urls.includes(url)) {
      return res.status(404).json({ msg: "URL not found." });
    }

    if (!user.changes) {
      user.changes = {};
    }

    user.changes[url] = (user.changes[url] || 0) + 1;

    const users = loadUsers();
    const updatedUsers = users.map((u) =>
      u.email === user.email ? user : u
    );

    saveUsers(updatedUsers);

    res.json({ msg: "Change count incremented successfully.", changes: user.changes[url] });
  } catch (err) {
    console.error("Error incrementing changes:", err);
    res.status(err.status || 500).json({ msg: err.msg || "Server error." });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));