// Step 2: Import from server.mjs
import { createApp } from "./server.mjs";

export default function handler(req, res) {
  res.status(200).json({ status: "ok", path: req.url, createApp: typeof createApp });
}
