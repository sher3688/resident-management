// Step 3: Call createApp()
import { createApp } from "./server.mjs";

let app;
try {
  app = createApp();
} catch(e) {
  // Fallback if createApp fails
  import express from "express";
  app = express();
  app.use(express.json());
}

app.use(function(_req, res) {
  res.status(404).json({ error: "API endpoint not found" });
});

export default app;
