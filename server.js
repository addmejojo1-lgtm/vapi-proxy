import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.all("/api/proxy", async (req, res) => {
  const path = req.query.path;

  if (!path) {
    return res.status(400).json({ error: "Missing path parameter" });
  }

  try {
    const url = `https://api.vapi.ai/${path}`;
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VAPI_PRIVATE_API}`,
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
