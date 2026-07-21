// Minimal handler - same as test.js
export default function handler(req, res) {
  res.status(200).json({ status: "ok", path: req.url, via: "handler" });
}
