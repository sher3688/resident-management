// Test 1: Just return JSON - no imports from server.mjs
export default function handler(req, res) {
  res.status(200).json({ status: "ok", path: req.url });
}
