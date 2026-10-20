export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message } = req.body || {};
    const KEY = process.env.GOOGLE_API_KEY;

    // Using Interactions API (as Google recommended) + REAL model that exists
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': KEY
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash', // <-- REAL model that works, not 3.8
        input: message
      })
    });

    const data = await r.json();
    if (!r.ok) {
      console.error(data);
      return res.status(r.status).json(data);
    }

    return res.status(200).json({ reply: data.output_text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
