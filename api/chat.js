export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});
  const key = process.env.GEMINI_KEY;
  if (!key) return res.status(500).json({error: 'GEMINI_KEY not set'});

  try {
    const { messages } = req.body;
    const prompt = messages?.[messages.length-1]?.content || 'hi';
    
    // Updated to new model name
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: JSON.stringify(data) });
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Empty reply';
    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
