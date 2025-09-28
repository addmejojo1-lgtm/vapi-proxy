import fetch from "node-fetch";

export default async function handler(req, res) {
  const { path } = req.query;

  // Forward request to Vapi API
  const url = `https://api.vapi.ai/${path.join("/")}`;
  
  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Authorization": `Bearer ${process.env.VAPI_PRIVATE_API}`,
        "Content-Type": "application/json"
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
