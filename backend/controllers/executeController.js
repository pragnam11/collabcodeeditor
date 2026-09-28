const axios = require("axios");

// Maps friendly language names to Judge0 CE language IDs
// Full list: https://ce.judge0.com/#statuses-and-languages-language-get
const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

/**
 * POST /api/execute
 * body: { code: string, language: string, stdin?: string }
 * Sends code to Judge0 for sandboxed execution and returns stdout/stderr.
 */
async function executeCode(req, res) {
  const { code, language, stdin = "" } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "code and language are required" });
  }

  const languageId = LANGUAGE_IDS[language.toLowerCase()];
  if (!languageId) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  try {
    // Step 1: submit code for execution (wait=true returns result synchronously)
    const submissionResponse = await axios.post(
      `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin,
      },
      {
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
          "X-RapidAPI-Host": process.env.JUDGE0_API_HOST,
        },
        timeout: 15000,
      }
    );

    const result = submissionResponse.data;

    return res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compile_output,
      status: result.status?.description,
      time: result.time,
      memory: result.memory,
    });
  } catch (err) {
    console.error("Execution error:", err.message);
    return res.status(500).json({
      error: "Code execution failed. Check Judge0 API credentials/quota.",
      details: err.message,
    });
  }
}

module.exports = { executeCode };
