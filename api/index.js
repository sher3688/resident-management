// Vercel serverless entry point - ESM module that loads CJS server bundle
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Set Vercel environment
process.env.VERCEL = "1";
process.env.NODE_ENV = "production";

// Load the CJS server bundle
// Try multiple paths since Vercel's deployment structure varies
const possiblePaths = [
  path.resolve(__dirname, "..", "dist", "server", "index.cjs"),
  path.resolve(__dirname, "..", "..", "dist", "server", "index.cjs"),
  path.resolve(process.env.LAMBDA_TASK_ROOT || __dirname, "..", "dist", "server", "index.cjs"),
];

let serverApp = null;
for (const serverPath of possiblePaths) {
  if (fs.existsSync(serverPath)) {
    try {
      serverApp = require(serverPath);
      console.log("[Vercel] Loaded server from:", serverPath);
      break;
    } catch (err) {
      console.warn("[Vercel] Failed to load server from:", serverPath, err.message);
    }
  }
}

// Create the Express app
const app = serverApp || express();

// Add body parsing if not already present (when server bundle couldn't be loaded)
if (!serverApp) {
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  console.warn("[Vercel] Server bundle not loaded, running frontend-only mode");
}

// Serve static frontend files
const staticPaths = [
  path.resolve(__dirname, "..", "dist", "public"),
  path.resolve(__dirname, "..", "..", "dist", "public"),
  path.resolve(process.env.LAMBDA_TASK_ROOT || __dirname, "..", "dist", "public"),
  path.resolve(process.env.LAMBDA_TASK_ROOT || __dirname, "..", "..", "dist", "public"),
  path.resolve(process.cwd(), "dist", "public"),
];

let staticPath = null;
for (const p of staticPaths) {
  if (fs.existsSync(p)) {
    staticPath = p;
    console.log("[Vercel] Static files at:", p);
    break;
  }
}

if (staticPath) {
  app.use(express.static(staticPath));
}

// SPA fallback
app.get("*", (_req, res) => {
  if (staticPath) {
    const indexPath = path.resolve(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  res.status(404).send("Not Found - " + (staticPath ? `staticPath: ${staticPath}` : "no static path found"));
});

export default app;
