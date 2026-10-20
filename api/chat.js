export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    const API_KEY = process.env.GOOGLE_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_API_KEY missing in Vercel' });
    }

    // NEW Interactions API - exactly as Google recommends
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/interactions`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input: message
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // New API returns output_text
    const reply = data.output_text || data.outputs?.[0]?.text || "No response";
    
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
