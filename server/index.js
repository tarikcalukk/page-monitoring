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

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "secret123";
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

  // Check if user already exists
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
}); //testirana radi

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ msg: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ msg: "Wrong password" });

  const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
}); // testirana radi

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
}); //testirana radi

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
}); //testirana radi

app.delete("/api/delete-account", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ msg: "Unauthorized" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    let usersList = loadUsers();
    const userIndex = usersList.findIndex((u) => u.email === decoded.email);

    if (userIndex === -1) return res.status(404).json({ msg: "User not found" });

    // Ukloni korisnika iz liste
    usersList.splice(userIndex, 1);

    users = usersList;
    saveUsers(users);

    res.json({ msg: "Account deleted successfully" });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(401).json({ msg: "Invalid token" });
  }
}); //testirana radi

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
}); //testirana radi


app.post("/api/save-url", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: "No token provided." });

  const token = authHeader.split(" ")[1];
  let email;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    email = decoded.email;
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token." });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ msg: "URL is required." });

  const users = loadUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(404).json({ msg: "User not found." });
  }

  if (!user.urls.includes(url)) {
    user.urls.push(url);
    saveUsers(users);
  }

  res.json({ msg: "URL saved successfully." });
});

app.get("/api/get-urls", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: "No token provided." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = loadUsers();
    const user = users.find((u) => u.email === decoded.email);

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    // Transformacija URL-ova u objekte ako su stringovi
    const urls = user.urls.map((url) =>
      typeof url === "string"
        ? { url, active: true, trackingType: "DOM" } // Podrazumevane vrednosti
        : url
    );

    res.json({ urls });
  } catch (err) {
    console.error("Error fetching URLs:", err);
    res.status(500).json({ msg: "Failed to fetch URLs." });
  }
});

app.post("/api/update-url", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: "No token provided." });

  const token = authHeader.split(" ")[1];
  let email;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    email = decoded.email; // Koristi email iz tokena za identifikaciju korisnika
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token." });
  }

  const { url, active, trackingType } = req.body;
  if (!url || active === undefined || !trackingType) {
    return res.status(400).json({ msg: "URL, active, and trackingType are required." });
  }

  // Učitaj korisnike iz users.json
  const users = loadUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(404).json({ msg: "User not found." });
  }

  // Ažuriraj stanje URL-a
  const urlIndex = user.urls.findIndex((u) => u.url === url);
  if (urlIndex === -1) {
    return res.status(404).json({ msg: "URL not found." });
  }

  user.urls[urlIndex].active = active;
  user.urls[urlIndex].trackingType = trackingType;

  saveUsers(users); // Sačuvaj ažuriranu listu korisnika u users.json

  res.json({ msg: "URL updated successfully." });
});

app.post("/api/fetch-content", async (req, res) => {
  const { url } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const fullHtml = $.html();
    const hash = crypto.createHash("sha256").update(fullHtml).digest("hex");

    // Parsiraj tekstualni sadržaj za upoređivanje
    const content = [];
    $("body *").each((_, el) => {
      const text = $(el).text().trim();
      if (text) content.push(text);
    });

    res.json({
      html: fullHtml,
      hash: hash,
      content: content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch page content." });
  }
}); //testirana radi

app.post("/api/add-log", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: "No token provided." });

  const token = authHeader.split(" ")[1];
  let email;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    email = decoded.email; // Koristi email iz tokena za identifikaciju korisnika
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token." });
  }

  const { url, method, changes } = req.body;
  if (!url || !method || !changes) {
    return res.status(400).json({ msg: "URL, method, and changes are required." });
  }

  // Učitaj korisnike iz users.json
  const users = loadUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(404).json({ msg: "User not found." });
  }

  // Dodaj log u niz logova korisnika
  const newLog = {
    url,
    method,
    changes,
    date: new Date().toISOString(),
  };
  user.logs.push(newLog);

  saveUsers(users); // Sačuvaj ažuriranu listu korisnika u users.json

  res.json({ msg: "Log added successfully." });
});

app.get("/api/logs", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: "No token provided." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = loadUsers();
    const user = users.find((u) => u.email === decoded.email);

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    res.json(user.logs || []);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ msg: "Failed to fetch logs." });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));