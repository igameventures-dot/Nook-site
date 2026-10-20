export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "GEMINI_KEY not set in Vercel > Settings > Environment Variables" } });
  }

  const { messages } = req.body;
  const lastUserMsg = messages?.filter(m => m.role === 'user').pop()?.content || "";
  const history = messages?.slice(-8).map(m => `${m.role}: ${m.content}`).join("\n") || "";

  const systemPrompt = `You are NOOK Concierge for NOOK Furniture, Abuja, Nigeria. Products: Executive Swivel Chair 95k, Kanu Table 199k (walnut coffee table), Yemi Chair 116k (boucle), Bimbo Dining 4-set 289k, Aura Lamp 52k, Fela Stool 95k (bar stool). Delivery: Abuja 1-2 days, Lagos 2-5 days. Be friendly, concise, mention Naira prices. Keep under 70 words.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nHistory:\n${history}\n\nUser: ${lastUserMsg}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error });
    }
    
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't reply. Try again.";

    return res.status(200).json({
      choices: [{ message: { content: reply } }]
    });

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
