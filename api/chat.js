export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "GEMINI_KEY not set in Vercel > Settings > Environment Variables" } });
  }

  const { messages } = req.body;
  if (!messages || !messages.length) {
    return res.status(400).json({ error: { message: "No messages provided" } });
  }

  const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || "";
  const history = messages.slice(-10).map(m => `${m.role}: ${m.content}`).join("\n");

  const systemPrompt = `You are NOOK Concierge for NOOK Furniture, Abuja, Nigeria.
Products:
- Executive Swivel Chair ₦95k
- Kanu Table ₦199k (walnut coffee table)
- Yemi Chair ₦116k (boucle accent)
- Bimbo Dining 4-set ₦289k
- Aura Lamp ₦52k
- Fela Stool ₦95k (bar stool)
Delivery: Abuja 1-2 days, Lagos 2-5 days.
Tone: minimal, warm, helpful. Keep under 80 words. Always mention prices in Naira.`;

  const fullPrompt = `${systemPrompt}\n\nConversation:\n${history}\n\nUser question: ${lastUserMsg}`;

  // List of models to try - auto-fallback if Google renames again
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest"
  ];

  for (const model of modelsToTry) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
        })
      });

      const data = await response.json();

      if (data.error) {
        console.log(`Model ${model} failed:`, data.error.message);
        // If model not found, try next one
        if (data.error.message.toLowerCase().includes("not found") || 
            data.error.message.toLowerCase().includes("not supported") || 
            data.error.message.toLowerCase().includes("no longer available")) {
          continue;
        }
        return res.status(500).json({ error: data.error });
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        return res.status(200).json({
          choices: [{ message: { content: reply } }]
        });
      }
    } catch (e) {
      console.log(`Model ${model} exception:`, e.message);
      continue;
    }
  }

  return res.status(500).json({ 
    error: { message: "All Gemini models failed. Your GEMINI_KEY may be invalid. Create a new one at https://aistudio.google.com/apikey and update in Vercel." } 
  });
  }
