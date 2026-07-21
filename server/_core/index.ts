import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite";
import { residentsExportRouter } from "../residents-export";
import { initializeDemoUsers } from "../password-auth";
import uploadRoutes from "../upload-routes";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Create the Express app and configure all routes
export function createApp(): express.Express {
  const app = express();

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Residents export API
  app.use("/api/residents", residentsExportRouter);

  // File upload API
  app.use("/api", uploadRoutes);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Serve static files in production
  serveStatic(app);

  return app;
}

async function startServer() {
  // Auto-initialize demo users (admin/admin123)
  try {
    await initializeDemoUsers();
    console.log("Demo users initialized successfully");
  } catch (error) {
    console.error("Failed to initialize demo users:", error);
  }

  const app = createApp();
  const server = createServer(app);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`[Server] Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[Server] Running on http://localhost:${port}/`);
  });
}

// For Vercel serverless: the api/index.js wrapper will call createApp()
// For local: start the server
const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isVercel) {
  // Auto-initialize demo users only in local development
  initializeDemoUsers().catch((err) => {
    console.warn("[Server] Demo users init:", err.message);
  });

  startServer().catch((error) => {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  });
}
