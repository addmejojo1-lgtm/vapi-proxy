import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// quick health check
app.get("/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

function buildUpstreamUrl(req) {
  // supports both styles:
  //  - /proxy/<anything>   e.g. /proxy/v2/calls?limit=50
  //  - /api/proxy?path=<anything>  e.g. /api/proxy?path=v2/calls&limit=50
  if (req.path.startsWith("/proxy/")) {
    const tail = req.path.replace(/^\/proxy\//, "");
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return `https://api.vapi.ai/${tail}${qs}`;
  }
  if (req.path === "/api/proxy" && req.query.path) {
    const tail = String(req.query.path).replace(/^\//, "");
    const qs = Object.entries(req.query)
      .filter(([k]) => k !== "path")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    return `https://api.vapi.ai/${tail}${qs ? "?" + qs : ""}`;
  }
  return null;
}

app.all(["/proxy/*", "/api/proxy"], async (req, res) => {
  const url = buildUpstreamUrl(req);
  if (!url) return res.status(400).json({ error: "Missing path" });

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        "Authorization": `Bearer ${process.env.VAPI_PRIVATE_API}`,
        "Content-Type": "application/json",
      },
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    const bodyText = await upstream.text();

    // log what happened (visible in Render > Logs)
    console.log(`[${upstream.status}] ${req.method} -> ${url} :: ${bodyText.slice(0, 200)}`);

    // try to return JSON; otherwise return raw text
    try {
      const json = JSON.parse(bodyText);
      return res.status(upstream.status).json(json);
    } catch {
      res.set("Content-Type", "text/plain");
      return res.status(upstream.status).send(bodyText);
    }
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(502).json({ error: "Upstream error", detail: String(err) });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Proxy listening on ${PORT}`));
