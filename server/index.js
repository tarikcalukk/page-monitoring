const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const https = require("https");
const cheerio = require("cheerio");
const crypto = require("crypto");
const fetch = require("node-fetch"); 

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "secret123";
const users = []; // Store users in memory

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

    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
}); //testirana radi

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
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
    const user = users.find((u) => u.email === decoded.email);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const hashed = await bcrypt.hash(req.body.newPassword, 10);
    user.password = hashed;
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
    const userIndex = users.findIndex((u) => u.email === decoded.email);

    if (userIndex === -1) return res.status(404).json({ msg: "User not found" });

    users.splice(userIndex, 1); // Remove user from the array

    res.json({ msg: "Account deleted successfully" });
  } catch (err) {
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

app.post("/api/fetch-content", async (req, res) => {
  const { url } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Dohvati cijeli HTML sadržaj
    const fullHtml = $.html();

    // Dohvati inline stilove i vanjske stilove
    let styles = $("style").map((i, el) => $(el).html()).get().join('\n'); // inline stilovi
    const externalStyles = $("link[rel='stylesheet']").map((i, el) => $(el).attr("href")).get();
    
    // Preuzmi vanjske stilove (ako je potrebno)
    for (let styleUrl of externalStyles) {
      const styleResponse = await fetch(styleUrl);
      const styleText = await styleResponse.text();
      styles += '\n' + styleText;
    }

    const htmlHash = crypto.createHash("sha256").update(fullHtml).digest("hex");
    const stylesHash = crypto.createHash("sha256").update(styles).digest("hex");

    res.json({
      html: fullHtml,
      html_hash: htmlHash,
      styles: styles,
      styles_hash: stylesHash
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch page content." });
  }
}); //testirana radi

app.get("/api/logs", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ msg: "Unauthorized" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.email === decoded.email);
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user.logs || []);
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
});

app.post("/api/log", async (req, res) => {
  const { email, url, method, changes } = req.body;

  if (!email || !url || !method || !changes) {
    return res.status(400).json({ msg: "Missing log data" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.logs.push({
      url,
      method,
      changes,
      date: new Date().toISOString(),
    });

    await user.save();
    res.status(200).json({ msg: "Log saved" });
  } catch (err) {
    console.error("Error saving log:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));