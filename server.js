const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — allow cross-origin requests (used by uptime monitor, etc.)
app.use(cors());

// ---------------------------------------------------------------------------
// 1. Per-request nonce generator (used by CSP and HTML nonce injection)
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64url");
  next();
});

// ---------------------------------------------------------------------------
// 2. Security headers via Helmet
//    Sets: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options,
//          Referrer-Policy, Strict-Transport-Security, and more.
// ---------------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Inline scripts need a per-request nonce; external scripts from 'self'
        // are allowed automatically.
        scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
        // Allow inline styles (style attributes) + Google Fonts stylesheet
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        // Google Fonts
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        // Images: self + data: URIs (used by matrix canvas)
        imgSrc: ["'self'", "data:"],
        // No plugins
        objectSrc: ["'none'"],
        // No framing (clickjacking protection)
        frameAncestors: ["'none'"],
        // Upgrade HTTP to HTTPS when possible
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // keep false so Google Fonts load
  }),
);

// ---------------------------------------------------------------------------
// 3. Static assets (JS, CSS, images) — served normally
//     HTML files are excluded — they go through nonce injection via routes.
// ---------------------------------------------------------------------------
const staticMiddleware = express.static(path.join(__dirname, "frontend"), {
  index: false,
});

app.use((req, res, next) => {
  if (req.path.endsWith(".html")) return next();
  staticMiddleware(req, res, next);
});

// ---------------------------------------------------------------------------
// 4. HTML page routes — inject per-request nonce into __NONCE__ placeholders
// ---------------------------------------------------------------------------
function serveHtml(res, filePath) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error loading page");
    }
    const html = data.replace(/__NONCE__/g, res.locals.nonce);
    res.type("html").send(html);
  });
}

app.get("/", (req, res) => {
  serveHtml(res, path.join(__dirname, "frontend", "index.html"));
});

app.get("/leaderboard", (req, res) => {
  serveHtml(res, path.join(__dirname, "frontend", "leaderboard.html"));
});

app.get("/about", (req, res) => {
  serveHtml(res, path.join(__dirname, "frontend", "about.html"));
});

app.get("/registration", (req, res) => {
  serveHtml(res, path.join(__dirname, "frontend", "registration.html"));
});

// Redirect direct .html file access so nonce injection still applies
app.get(/\.html$/, (req, res) => {
  const cleanPath = req.path.replace(/\.html$/, "");
  res.redirect(301, cleanPath || "/");
});

// ---------------------------------------------------------------------------
// 5. Utility endpoints
// ---------------------------------------------------------------------------
app.get("/uptime", (req, res) => {
  res.json({ status: "Website is running ✅" });
});

// ---------------------------------------------------------------------------
// 6. 404
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).send("Page not found");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
