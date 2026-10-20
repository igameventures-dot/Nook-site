export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const key = process.env.GEMINI_KEY;
  if (!key) return res.status(500).json({error: 'GEMINI_KEY not set'});

  try {
    const { messages } = req.body;
    const prompt = messages?.[messages.length-1]?.content || 'hi';

    const googleRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await googleRes.json();
    if (!googleRes.ok) return res.status(500).json({ error: `GOOGLE ERROR: ${JSON.stringify(data)}` });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Empty reply';
    return res.status(200).json({ reply: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
