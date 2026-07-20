// Vercel serverless entry point - ESM
// This file combines the backend Express app with frontend static file serving

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the bundled server (ESM format)
import { createApp } from "../dist/server/index.js";

// Create the Express app with all backend routes (tRPC, auth, upload, etc.)
const app = createApp();

// Serve static frontend files
const staticPath = path.resolve(__dirname, "..", "dist", "public");
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  console.log("[Vercel] Serving static files from:", staticPath);
}

// SPA fallback - serve index.html for unmatched GET requests
app.get("*", (_req, res) => {
  const indexPath = path.resolve(staticPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Not Found");
  }
});

// Export for Vercel serverless
export default app;
