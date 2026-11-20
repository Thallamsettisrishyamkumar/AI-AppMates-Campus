// Shared AI caller. Uses Groq. Without a key the callers use the built-in demo answers.
const MODEL = () => process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const FALLBACK_MODEL = () => process.env.GROQ_FALLBACK_MODEL || "llama-3.3-70b-versatile";
const hasKey = () => !!process.env.GROQ_API_KEY;

async function callGroq(model, messages, json = false) {
  const body = { model, messages, temperature: 0.4, max_completion_tokens: 4096 };
  if (model.startsWith("openai/gpt-oss")) body.reasoning_effort = "medium";
  if (json) body.response_format = { type: "json_object" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(result.error?.message || `Groq API error: ${response.status}`);
      err.status = response.status;
      throw err;
    }
    const reply = result.choices?.[0]?.message?.content;
    if (!reply || !reply.trim()) throw new Error("Groq returned an empty response.");
    return { reply: reply.trim(), model };
  } finally {
    clearTimeout(timer);
  }
}

async function makeReply(messages, json = false) {
  try {
    return await callGroq(MODEL(), messages, json);
  } catch (err) {
    const retry = err.name === "AbortError" || !err.status || err.status === 429 || err.status >= 500 || /empty/i.test(err.message);
    if (retry && FALLBACK_MODEL() !== MODEL()) return callGroq(FALLBACK_MODEL(), messages, json);
    throw err;
  }
}

module.exports = { makeReply, hasKey };
