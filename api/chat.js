// Vercel Serverless Function — LLM proxy to Google Gemini
// Keeps API key server-side, never exposed to the browser.
// Accepts the same request format as the chatbot's Ollama calls,
// translates to Gemini API, and returns in the same response format.

// Simple in-memory rate limiter (per serverless instance)
const rateMap = new Map();
const RATE_LIMIT = 12; // max requests per window
const RATE_WINDOW = 60000; // 1 minute

function checkRate(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

export default async function handler(req, res) {
  // CORS headers for Vercel
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit check
  const clientIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (!checkRate(clientIp)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    const { messages, options } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing messages array" });
    }

    // Translate OpenAI/Ollama message format to Gemini format
    // Gemini uses: { contents: [{role, parts: [{text}]}], systemInstruction: {parts: [{text}]} }
    const systemMsg = messages.find(m => m.role === "system");
    const chatMsgs = messages.filter(m => m.role !== "system");

    const contents = chatMsgs.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // Ensure conversation starts with a user message (Gemini requirement)
    if (contents.length === 0 || contents[0].role !== "user") {
      contents.unshift({ role: "user", parts: [{ text: "Hello" }] });
    }

    // Ensure alternating roles (Gemini requirement)
    const cleanContents = [];
    for (let i = 0; i < contents.length; i++) {
      if (i > 0 && contents[i].role === contents[i-1].role) {
        // Merge same-role messages
        cleanContents[cleanContents.length - 1].parts[0].text += "\n" + contents[i].parts[0].text;
      } else {
        cleanContents.push(contents[i]);
      }
    }

    const temperature = options?.temperature ?? 0.8;
    const maxTokens = options?.num_predict ?? 200;

    const geminiBody = {
      contents: cleanContents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.95,
      }
    };

    // Add system instruction if present
    if (systemMsg) {
      geminiBody.systemInstruction = {
        parts: [{ text: systemMsg.content }]
      };
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
      signal: AbortSignal.timeout(20000)
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return res.status(502).json({ error: "Gemini API error", status: geminiRes.status });
    }

    const geminiData = await geminiRes.json();

    // Extract the response text
    const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Return in the same format as Ollama: { message: { content: "..." } }
    return res.status(200).json({
      message: { content: replyText }
    });

  } catch (err) {
    console.error("Chat proxy error:", err);
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return res.status(504).json({ error: "LLM request timed out" });
    }
    return res.status(500).json({ error: err.message });
  }
}
