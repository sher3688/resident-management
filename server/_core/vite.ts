import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Determine the correct path for static files
  let distPath: string;

  // Vercel serverless: dist/index.js is deployed, public/ is sibling directory
  // In Vercel, the function root is the output directory
  const vercelPath = path.resolve(process.env.LAMBDA_TASK_ROOT || __dirname, "public");
  
  // Local development: dist/public from project root
  const localPath = path.resolve(process.cwd(), "dist", "public");

  if (fs.existsSync(vercelPath)) {
    distPath = vercelPath;
    console.log(`[Server] Using static files from: ${distPath}`);
  } else if (fs.existsSync(localPath)) {
    distPath = localPath;
    console.log(`[Server] Using static files from: ${distPath}`);
  } else {
    distPath = vercelPath;
    console.warn(`[Server] Static files not found at: ${vercelPath} or ${localPath}`);
  }

  app.use(express.static(distPath));

  // SPA fallback: serve index.html for any unmatched route
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: "Not Found" });
    }
  });
}
