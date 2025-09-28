import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.all("/proxy/*", async (req, res) => {
  const path = req.params[0]; // everything after /proxy/
  const url = `https://api.vapi.ai/${path}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VAPI_PRIVATE_API}`
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server running on port ${port}`));
