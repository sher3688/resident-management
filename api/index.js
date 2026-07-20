// Vercel serverless entry point
// We need to load the bundled server and get the Express app

const path = require("path");
const fs = require("fs");

// Create a new Express app that serves the frontend
const express = require("express");
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve static files
const staticPath = path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(staticPath));

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
