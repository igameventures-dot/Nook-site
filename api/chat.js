export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});
  
  const key = process.env.GEMINI_KEY;
  if (!key) return res.status(500).json({error: 'GEMINI_KEY not set in Vercel > Settings > Environment Variables'});

  try {
    const { messages } = req.body;
    const lastMsg = messages[messages.length - 1]?.content || "hi";

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{ parts: [{ text: lastMsg }] }]
      })
    });

    const data = await r.json();
    
    if (!r.ok) {
      console.error("GOOGLE ERROR:", data);
      return res.status(500).json({error: `Google says: ${JSON.stringify(data)}`});
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply from Gemini";
    return res.status(200).json({ reply });

  } catch (e) {
    console.error(e);
    return res.status(500).json({error: e.message});
  }
}
