const router = require("express").Router();
const { data, save, log, byId, childrenOf, descendants, ancestors, ROLE_LABEL } = require("../db");
const { auth } = require("../middleware/auth");
const { profileOf } = require("../personas");
const { demoReply } = require("../demo");

const { makeReply, hasKey } = require("../ai");
const HISTORY_KEEP = 40;
const HISTORY_SEND = 12;

const today = () => new Date().toISOString().slice(0, 10);
const nm = (id) => (byId(id) || {}).name || "Removed";
const line = (t, who) => `- #${t.id} "${t.title}", ${t.priority} priority, ${t.status}, due ${t.dueDate || "not set"}${t.dueDate && t.dueDate < today() && !["approved", "submitted"].includes(t.status) ? ", OVERDUE" : ""}, ${who}`;

// Builds the system prompt: personality, who the person is, their real work, and answer rules
function buildSystem(mate, user, focus) {
  const p = profileOf(mate);
  const received = data.tasks.filter((t) => t.assigneeId === user.id).slice(0, 15);
  const given = data.tasks.filter((t) => t.assignedBy === user.id).slice(0, 15);
  const above = ancestors(user.id);
  const others = data.appmates.filter((a) => a.id !== mate.id && a.type === "appmate").map((a) => a.name).join(", ");
  let team = "";
  if (user.role !== "student") {
    const kids = childrenOf(user.id);
    team = `\nPeople directly below them: ${kids.length ? kids.map((k) => `${k.name} (${ROLE_LABEL[k.role]})`).join(", ") : "none yet"}. Total people in their team: ${descendants(user.id).length}.`;
  }

  let focusText = "";
  if (focus) {
    focusText = `\nFOCUS ASSIGNMENT: #${focus.id} "${focus.title}", ${focus.priority} priority, status ${focus.status}, due ${focus.dueDate || "not set"}.\nDescription given by ${nm(focus.assignedBy)}: ${focus.description || "none"}`;
    if (focus.assignedBy === user.id && focus.submission) {
      focusText += `\nSUBMISSION by ${nm(focus.assigneeId)} (attempt ${focus.submission.attempt}):\n"""\n${focus.submission.text || "(no text)"}\n"""\n${focus.submission.link ? "Link given: " + focus.submission.link : ""}`;
    }
    focusText += "\nGive a real, complete, useful answer for exactly this assignment from your speciality. Do not give generic advice.\n";
  }

  return `You are ${mate.name}, the ${p.title} AppMate on the AI AppMates Campus platform, used by a university with the levels Vice Chancellor, Head of Department, Faculty and Student.
${p.voice}

Your speciality: ${mate.description || p.title}.
Other AppMates available in the university: ${others}. If a question clearly belongs to one of them, still give a short useful answer, then name the better AppMate to ask.

The person you are helping:
- Name: ${user.name}
- Level: ${ROLE_LABEL[user.role]}${user.department ? `, department ${user.department}` : ""}${user.subject ? `, subject ${user.subject}` : ""}
- Reports to: ${above.length ? above[0].name + " (" + ROLE_LABEL[above[0].role] + ")" : "nobody, this is the top level"}${team}
- Today's date: ${today()}
- Preferred language: ${user.language || "English"}

Work assigned to them:
${received.length ? received.map((t) => line(t, "from " + nm(t.assignedBy))).join("\n") : "- none"}
${given.length ? "\nWork they assigned to others:\n" + given.map((t) => line(t, "to " + nm(t.assigneeId))).join("\n") : ""}
${focusText}
How to answer:
- Start with the answer or the deliverable. No long introductions.
- Be specific to this person's level, subject and work. Use the details above when relevant.
- Use simple, plain English and short sentences. Do not use emojis or decorative symbols.
- Format with Markdown: short headings, bullets, tables, and fenced code blocks with the language name.
- Do the work (write the plan, the notice, the rubric, the explanation). Do not only describe how to do it.
- If something important is missing, make a sensible assumption, state it in one line, and continue. Ask at most one question, at the end.
- Reply in ${user.language || "English"}. Keep code, file names and technical terms in English.
- Never invent names, numbers, papers or rules you do not have. Never claim you did things outside this chat.`;
}

const bucket = (userId, mateId) => {
  data.chats[userId] = data.chats[userId] || {};
  data.chats[userId][mateId] = data.chats[userId][mateId] || [];
  return data.chats[userId][mateId];
};
const canUse = (user, mate) => user.appmateIds.includes(mate.id);
const canSeeTask = (user, t) => t.assigneeId === user.id || t.assignedBy === user.id;

router.get("/history", auth, (req, res) => {
  const user = byId(req.user.id);
  const mate = data.appmates.find((a) => a.id === Number(req.query.appmateId));
  if (!user || !mate || !canUse(user, mate)) return res.json([]);
  res.json(bucket(user.id, mate.id));
});

router.delete("/history", auth, (req, res) => {
  if (data.chats[req.user.id]) data.chats[req.user.id][Number(req.query.appmateId)] = [];
  save();
  res.json({ ok: true });
});

router.post("/", auth, async (req, res) => {
  try {
    const { appmateId, message, taskId } = req.body;
    const user = byId(req.user.id);
    const mate = data.appmates.find((a) => a.id === Number(appmateId));
    if (!user) return res.status(401).json({ message: "User not found" });

    const task = taskId ? data.tasks.find((t) => t.id === Number(taskId)) : null;
    if (task && !canSeeTask(user, task)) return res.status(403).json({ message: "This is not your assignment" });
    const cleanMessage = String(message || (task ? `Help me with this assignment: "${task.title}"` : "")).trim().slice(0, 10000);

    if (!mate || !cleanMessage) return res.status(400).json({ message: "AppMate and message are required" });
    if (!canUse(user, mate)) return res.status(403).json({ message: "This AppMate is not available for your level" });

    const history = bucket(user.id, mate.id);
    let result;
    if (hasKey()) {
      const memory = history.slice(-HISTORY_SEND).map((m) => ({ role: m.from === "me" ? "user" : "assistant", content: m.text }));
      result = await makeReply([{ role: "system", content: buildSystem(mate, user, task) }, ...memory, { role: "user", content: cleanMessage }]);
    } else {
      result = { reply: demoReply(mate, user, task, cleanMessage), model: "demo" };
    }

    history.push({ from: "me", text: cleanMessage, time: new Date().toISOString() });
    history.push({ from: "ai", text: result.reply, time: new Date().toISOString() });
    data.chats[user.id][mate.id] = history.slice(-HISTORY_KEEP);
    save();

    log(user.id, "chat", `${user.name} used ${mate.name}${task ? ` on "${task.title}"` : ""}`);
    return res.json({ reply: result.reply, provider: result.model === "demo" ? "Demo" : "Groq", model: result.model });
  } catch (error) {
    console.error("AppMate AI Error:", error.message);
    return res.status(502).json({ message: error.name === "AbortError" ? "The AI took too long. Please try again." : `AI service failed: ${error.message}` });
  }
});

module.exports = router;
