const fs = require('fs');
const path = require('path');

// Read the ESM server bundle
const serverCode = fs.readFileSync(path.join(__dirname, 'dist', 'server', 'index.js'), 'utf8');

// The ESM bundle exports createApp. We need to:
// 1. Include the bundle code
// 2. Import createApp from it
// 3. Add frontend serving logic
// 4. Export default the Express app

const apiCode = `// Vercel serverless entry point
// Contains the full backend server bundle + frontend static file serving

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set Vercel environment
process.env.VERCEL = "1";
process.env.NODE_ENV = "production";

// --- Server Bundle (inlined from dist/server/index.js) ---
${serverCode}
// --- End Server Bundle ---

// Create the Express app with all backend routes
const app = createApp();

// Serve static frontend files from dist/public
// In Vercel, dist/ is in the output directory, and api/index.js is in the functions directory
// The relative path depends on Vercel's deployment structure
const staticPaths = [
  path.resolve(__dirname, "..", "dist", "public"),
  path.resolve(__dirname, "..", "..", "dist", "public"),
  path.resolve(process.env.LAMBDA_TASK_ROOT || __dirname, "public"),
  path.resolve(process.cwd(), "dist", "public"),
];

let staticPath = null;
for (const p of staticPaths) {
  if (fs.existsSync(p)) {
    staticPath = p;
    console.log("[Vercel] Found static files at:", p);
    break;
  }
}

if (staticPath) {
  app.use(express.static(staticPath));
} else {
  console.warn("[Vercel] No static files found. Checked:", staticPaths);
}

// SPA fallback
app.get("*", (_req, res) => {
  if (staticPath) {
    const indexPath = path.resolve(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  res.status(404).send("Not Found");
});

// Export for Vercel serverless
export default app;
`;

fs.writeFileSync(path.join(__dirname, 'api', 'index.js'), apiCode);
console.log('Generated api/index.js successfully');
console.log('Size:', (apiCode.length / 1024).toFixed(1), 'KB');
console.log('Lines:', apiCode.split('\n').length);
