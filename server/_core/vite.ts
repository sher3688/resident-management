import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Skip static file serving in Vercel serverless environment
  // Vercel handles static files via outputDirectory and rewrites
  const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isVercel) {
    console.log("[Server] Skipping serveStatic in Vercel serverless environment");
    return;
  }

  // Determine the correct path for static files
  let distPath: string;

  // Local development: dist/public from project root
  const localPath = path.resolve(process.cwd(), "dist", "public");

  if (fs.existsSync(localPath)) {
    distPath = localPath;
    console.log(`[Server] Using static files from: ${distPath}`);
  } else {
    console.warn(`[Server] Static files not found at: ${localPath}`);
    return;
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
