const axios = require("axios");

/**
 * POST /api/ai-debug
 * body: { code: string, language: string, errorMessage?: string }
 *
 * Sends the code (and, if present, the error/stderr from the last run)
 * to an LLM and asks it to explain the bug and suggest a fix.
 * Works with any OpenAI-compatible chat completions endpoint.
 */
async function debugWithAI(req, res) {
  const { code, language, errorMessage = "" } = req.body;

  if (!code) {
    return res.status(400).json({ error: "code is required" });
  }

  const systemPrompt =
    "You are a concise coding assistant embedded in a code editor. " +
    "Given source code (and optionally a runtime/compile error), identify the bug, " +
    "explain it in 2-3 short sentences, then provide a corrected code snippet. " +
    "Respond ONLY in JSON with keys: explanation, fixedCode, suggestions (array of short tips).";

  const userPrompt = `Language: ${language}\n\nCode:\n${code}\n\nError (if any):\n${
    errorMessage || "None reported"
  }`;

  try {
    const response = await axios.post(
      process.env.AI_API_URL,
      {
        model: process.env.AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
        },
        timeout: 20000,
      }
    );

    const rawContent = response.data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // Fallback: model didn't return strict JSON, send raw text back
      parsed = { explanation: rawContent, fixedCode: null, suggestions: [] };
    }

    return res.json(parsed);
  } catch (err) {
    console.error("AI debug error:", err.message);
    return res.status(500).json({
      error: "AI debugging request failed. Check AI_API_KEY/AI_API_URL.",
      details: err.message,
    });
  }
}

module.exports = { debugWithAI };
