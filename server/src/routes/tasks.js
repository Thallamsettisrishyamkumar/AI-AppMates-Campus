const router = require("express").Router();
const crypto = require("crypto");
const { data, save, nextId, log, byId, childrenOf, descendants, ancestors, putFile, getFile } = require("../db");
const { auth, leaderOnly } = require("../middleware/auth");
const { suggestFor, profileOf } = require("../personas");
const { notify } = require("../notify");
const { makeReply, hasKey } = require("../ai");

const today = () => new Date().toISOString().slice(0, 10);
const ORDER = { returned: 0, assigned: 1, "in-progress": 2, submitted: 3, approved: 4 };
const OK_EXT = ["pdf", "png", "jpg", "jpeg", "docx", "pptx", "xlsx", "txt", "zip", "csv"];
const MAX_FILE = 3 * 1024 * 1024;

function decorate(t) {
  const a = byId(t.assigneeId) || {};
  const b = byId(t.assignedBy) || {};
  return {
    ...t,
    assigneeName: a.name || "Removed", assigneeRole: a.role, assignerName: b.name || "Removed", assignerRole: b.role,
    overdue: !!t.dueDate && t.dueDate < today() && t.status !== "approved" && t.status !== "submitted"
  };
}
const sortTasks = (l) => l.sort((x, y) => (ORDER[x.status] - ORDER[y.status]) || String(x.dueDate || "9").localeCompare(String(y.dueDate || "9")));
const mateList = (user) => data.appmates.filter((m) => user.appmateIds.includes(m.id));

router.get("/", auth, (req, res) => {
  const me = byId(req.user.id);
  const mates = mateList(me);
  const evalMate = mates.find((m) => m.name === "EvalMate");
  const received = sortTasks(data.tasks.filter((t) => t.assigneeId === me.id).map(decorate)).map((t) => ({ ...t, suggestions: suggestFor(t, mates) }));
  const given = sortTasks(data.tasks.filter((t) => t.assignedBy === me.id).map(decorate)).map((t) => ({ ...t, reviewMateId: evalMate ? evalMate.id : null }));
  const out = { received, given };
  if (me.role !== "student") {
    const ids = new Set(descendants(me.id).map((u) => u.id));
    out.all = sortTasks(data.tasks.filter((t) => ids.has(t.assigneeId)).map(decorate));
  }
  res.json(out);
});

// Assign work to one person, or to everyone directly below me at once
router.post("/", auth, leaderOnly, (req, res) => {
  const me = byId(req.user.id);
  const { title, description, assigneeId, priority, dueDate } = req.body;
  if (!String(title || "").trim()) return res.status(400).json({ message: "Title is required" });
  const kids = childrenOf(me.id);
  const targets = assigneeId === "all" ? kids : kids.filter((u) => u.id === Number(assigneeId));
  if (!targets.length) return res.status(400).json({ message: "You can assign only to people directly below you" });
  const batch = targets.length > 1 ? crypto.randomBytes(4).toString("hex") : undefined;
  const made = targets.map((to) => {
    const task = {
      id: nextId(data.tasks), title: String(title).trim(), description: String(description || "").trim().slice(0, 3000),
      assignedBy: me.id, assigneeId: to.id, priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
      status: "assigned", dueDate: dueDate || "", createdAt: new Date().toISOString(), submission: null, review: null, comments: [], batch
    };
    data.tasks.push(task);
    notify(to.id, `${me.name} assigned you "${task.title}"${task.dueDate ? `, due ${task.dueDate}` : ""}`, "/assignments");
    return task;
  });
  save();
  log(me.id, "task", `${me.name} assigned "${made[0].title}" to ${targets.length > 1 ? targets.length + " people" : targets[0].name}`);
  res.status(201).json({ count: made.length });
});

const mine = (req, res, key) => {
  const t = data.tasks.find((x) => x.id === Number(req.params.id));
  if (!t) { res.status(404).json({ message: "Assignment not found" }); return null; }
  if (t[key] !== req.user.id) { res.status(403).json({ message: key === "assigneeId" ? "This is not assigned to you" : "You did not assign this" }); return null; }
  return t;
};

router.put("/:id/start", auth, (req, res) => {
  const t = mine(req, res, "assigneeId");
  if (!t) return;
  if (t.status === "assigned") { t.status = "in-progress"; save(); log(req.user.id, "task", `${byId(req.user.id).name} started "${t.title}"`); }
  res.json(decorate(t));
});

// Submit the work, with optional files, to the person who assigned it
router.post("/:id/submit", auth, async (req, res) => {
  const t = mine(req, res, "assigneeId");
  if (!t) return;
  if (t.status === "approved") return res.status(400).json({ message: "This work is already approved" });
  if (t.status === "submitted") return res.status(400).json({ message: "Already submitted. Wait for the review" });
  const text = String(req.body.text || "").trim().slice(0, 20000);
  const link = String(req.body.link || "").trim().slice(0, 500);
  const incoming = Array.isArray(req.body.files) ? req.body.files.slice(0, 3) : [];
  if (!text && !link && !incoming.length) return res.status(400).json({ message: "Write your work, add a link or attach a file" });
  if (link && !/^https?:\/\//i.test(link)) return res.status(400).json({ message: "The link must start with http or https" });

  const files = [];
  for (const f of incoming) {
    const name = String(f.name || "file").replace(/[^\w.\- ]/g, "_").slice(0, 80);
    const ext = name.split(".").pop().toLowerCase();
    if (!OK_EXT.includes(ext)) return res.status(400).json({ message: `File type .${ext} is not allowed. Use: ${OK_EXT.join(", ")}` });
    const buffer = Buffer.from(String(f.data || ""), "base64");
    if (!buffer.length) return res.status(400).json({ message: `${name} is empty` });
    if (buffer.length > MAX_FILE) return res.status(400).json({ message: `${name} is larger than 3 MB` });
    const id = crypto.randomBytes(12).toString("hex");
    await putFile(id, name, String(f.type || "application/octet-stream"), buffer);
    files.push({ id, name, size: buffer.length });
  }

  const late = !!t.dueDate && today() > t.dueDate;
  t.submission = { text, link, files, late, time: new Date().toISOString(), attempt: ((t.submission && t.submission.attempt) || 0) + 1 };
  t.status = "submitted";
  save();
  const me = byId(req.user.id);
  notify(t.assignedBy, `${me.name} submitted "${t.title}"${late ? " (late)" : ""}`, "/assignments?tab=given");
  log(me.id, "submit", `${me.name} submitted "${t.title}" to ${(byId(t.assignedBy) || {}).name}${late ? " (late)" : ""}`);
  res.json(decorate(t));
});

router.post("/:id/review", auth, leaderOnly, (req, res) => {
  const t = mine(req, res, "assignedBy");
  if (!t) return;
  if (t.status !== "submitted") return res.status(400).json({ message: "Nothing to review yet" });
  const decision = req.body.decision;
  const remarks = String(req.body.remarks || "").trim().slice(0, 3000);
  if (!["approve", "return"].includes(decision)) return res.status(400).json({ message: "Choose approve or return" });
  if (decision === "return" && !remarks) return res.status(400).json({ message: "Write what needs to change" });
  const marks = req.body.marks === "" || req.body.marks == null ? null : Number(req.body.marks);
  if (marks !== null && (Number.isNaN(marks) || marks < 0 || marks > 100)) return res.status(400).json({ message: "Marks must be between 0 and 100" });
  t.review = { decision, remarks, marks, time: new Date().toISOString() };
  t.status = decision === "approve" ? "approved" : "returned";
  save();
  notify(t.assigneeId, `${byId(req.user.id).name} ${decision === "approve" ? "approved" : "returned for changes"} "${t.title}"${marks !== null ? `, marks ${marks}` : ""}`, "/assignments");
  log(req.user.id, "review", `${byId(req.user.id).name} ${decision === "approve" ? "approved" : "returned"} "${t.title}" of ${(byId(t.assigneeId) || {}).name}`);
  res.json(decorate(t));
});

// EvalMate reads the submission and suggests marks and feedback. The reviewer decides.
router.post("/:id/ai-review", auth, leaderOnly, async (req, res) => {
  const t = mine(req, res, "assignedBy");
  if (!t) return;
  if (t.status !== "submitted" || !t.submission) return res.status(400).json({ message: "Nothing to review yet" });
  if (!hasKey()) {
    return res.json({ marks: 70, remarks: "Demo suggestion. Strengths: the work is submitted on time and addresses the task. Gaps: add more detail and examples. Improve: explain your reasoning and test with edge cases.", model: "demo" });
  }
  try {
    const who = byId(t.assigneeId) || {};
    const sys = `You are EvalMate, an assessment expert. Review a student's submission against the assignment. Reply with JSON only: {"marks": number from 0 to 100, "remarks": "kind, specific feedback in plain English with strengths, gaps and 3 improvement points"}. Be fair and strict. The faculty makes the final decision.`;
    const user = `Assignment: ${t.title}\nInstructions: ${t.description || "none"}\nStudent: ${who.name}\nSubmission text:\n${t.submission.text || "(none)"}\nLink: ${t.submission.link || "none"}\nFiles attached: ${(t.submission.files || []).map((f) => f.name).join(", ") || "none"} (you cannot open files, so say that marks are based on the text only)`;
    const r = await makeReply([{ role: "system", content: sys }, { role: "user", content: user }], true);
    const j = JSON.parse(r.reply.replace(/```json|```/g, "").trim());
    const marks = Math.max(0, Math.min(100, Math.round(Number(j.marks))));
    res.json({ marks: Number.isNaN(marks) ? null : marks, remarks: String(j.remarks || ""), model: r.model });
  } catch (err) {
    res.status(502).json({ message: "AI review failed: " + err.message });
  }
});

// Discussion between the assigner and the assignee
router.post("/:id/comments", auth, (req, res) => {
  const t = data.tasks.find((x) => x.id === Number(req.params.id));
  if (!t || (t.assigneeId !== req.user.id && t.assignedBy !== req.user.id)) return res.status(404).json({ message: "Assignment not found" });
  const text = String(req.body.text || "").trim().slice(0, 1500);
  if (!text) return res.status(400).json({ message: "Write a comment" });
  const me = byId(req.user.id);
  t.comments.push({ id: Date.now(), userId: me.id, name: me.name, role: me.role, text, time: new Date().toISOString() });
  t.comments = t.comments.slice(-60);
  save();
  notify(t.assigneeId === me.id ? t.assignedBy : t.assigneeId, `${me.name} commented on "${t.title}"`, "/assignments");
  res.json(t.comments);
});

// Download a submitted file: the owner, the reviewer, or anyone above them
router.get("/files/:fileId", auth, async (req, res) => {
  const task = data.tasks.find((t) => t.submission && (t.submission.files || []).some((f) => f.id === req.params.fileId));
  if (!task) return res.status(404).json({ message: "File not found" });
  const allowed = [task.assigneeId, task.assignedBy, ...ancestors(task.assigneeId).map((u) => u.id)];
  if (!allowed.includes(req.user.id)) return res.status(403).json({ message: "Not allowed" });
  const meta = task.submission.files.find((f) => f.id === req.params.fileId);
  const f = await getFile(req.params.fileId);
  if (!f) return res.status(404).json({ message: "File is missing from storage" });
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${meta.name}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(f.buffer);
});

router.delete("/:id", auth, leaderOnly, (req, res) => {
  const t = mine(req, res, "assignedBy");
  if (!t) return;
  data.tasks = data.tasks.filter((x) => x.id !== t.id);
  save();
  log(req.user.id, "task", `Deleted assignment "${t.title}"`);
  res.json({ ok: true });
});

module.exports = router;
