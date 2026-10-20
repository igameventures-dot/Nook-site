export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "GEMINI_KEY not set in Vercel" } });
  }

  const { messages } = req.body;
  const lastUserMsg = messages?.filter(m => m.role === 'user').pop()?.content || "";
  const history = messages?.slice(-8).map(m => `${m.role}: ${m.content}`).join("\n") || "";

  const prompt = `You are NOOK Concierge for NOOK Furniture, Abuja. Products: Executive Swivel Chair 95k, Kanu Table 199k, Yemi Chair 116k, Bimbo Dining 289k, Aura Lamp 52k, Fela Stool 95k. Delivery Abuja 1-2 days, Lagos 2-5 days. Be friendly, short, Naira prices. Under 70 words.\n\nHistory:\n${history}\n\nUser: ${lastUserMsg}`;

  // Try latest models in order
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

  for (const model of modelsToTry) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        // If model not found, try next model
        if (data.error.message?.includes("not found") || data.error.message?.includes("not supported") || data.error.message?.includes("no longer available")) {
          continue; 
        }
        return res.status(500).json({ error: data.error });
      }
      
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        return res.status(200).json({ choices: [{ message: { content: reply } }] });
      }
    } catch (e) {
      continue;
    }
  }

  return res.status(500).json({ error: { message: "All Gemini models failed. Try regenerating your GEMINI_KEY in Google AI Studio." } });
}
