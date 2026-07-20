// Vercel serverless entry point - combines backend API and frontend static files
const path = require("path");
const fs = require("fs");
const express = require("express");

const app = express();

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Try to load the backend bundle
try {
  process.env.VERCEL = "1";
  const distPath = path.resolve(__dirname, "..", "dist", "server", "index.js");
  if (fs.existsSync(distPath)) {
    const serverModule = require(distPath);
    // serverModule should be the Express app returned by createApp()
    if (serverModule && serverModule._router) {
      app.use(serverModule);
      console.log("[Vercel] Backend loaded successfully from dist/server/index.js");
    }
  }
} catch (err) {
  console.warn("[Vercel] Backend load warning:", err.message);
}

// Serve static frontend files
const staticPath = path.resolve(__dirname, "..", "dist", "public");
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  console.log("[Vercel] Static files:", staticPath);
}

// SPA fallback
app.get("*", (_req, res) => {
  const indexPath = path.resolve(staticPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Not Found");
  }
});

module.exports = app;
