// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// allow your dashboard origin; use "*" while testing
app.use(cors({ origin: "*"}));
app.use(express.json());

// simple health check
app.get("/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// log every request so you can see what route you actually hit
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.path} query=`, req.query);
  next();
});

// PROXY: everything after /proxy/ is forwarded to Vapi
app.all("/proxy/*", async (req, res) => {
  const path = req.params[0]; // e.g. "v2/calls"
  if (!path) return res.status(400).json({ error: "Missing target path after /proxy/" });

  const url = `https://api.vapi.ai/${path}`;
  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VAPI_PRIVATE_API}`,
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const text = await response.text(); // handle non-JSON bodies safely
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: err.message || "Proxy failed" });
  }
});

// 404 handler to make mistakes obvious
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    hint: "Use /proxy/<vapi-path>, e.g. /proxy/v2/calls",
    path: req.path
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
