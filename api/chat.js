export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'})
  
  const { message } = req.body
  const MODEL = "models/gemini-2.5-flash"
  const KEY = process.env.GOOGLE_API_KEY
  
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${KEY}`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({contents:[{parts:[{text: message}]}]})
  })
  
  const data = await r.json()
  if (!r.ok) return res.status(r.status).json(data)
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response"
  res.status(200).json({reply: text})
}
