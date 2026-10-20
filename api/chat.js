export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const MODEL = "models/gemini-3.8-flash";
    const KEY = process.env.GOOGLE_API_KEY;

    if (!KEY) {
      return res.status(500).json({ error: 'GOOGLE_API_KEY not set in Vercel' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: JSON.stringify(data) });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    return res.status(200).json({ reply: replyText });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
