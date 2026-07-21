// Step 1: Import express only (minimal dependency)
import express from "express";

export default function handler(req, res) {
  res.status(200).json({ status: "ok", path: req.url, express: typeof express });
}
