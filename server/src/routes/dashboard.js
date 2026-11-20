const router = require("express").Router();
const { data, publicUser, byId, childrenOf, descendants, ancestors } = require("../db");
const { auth } = require("../middleware/auth");
const { publicProfile, suggestFor } = require("../personas");

const today = () => new Date().toISOString().slice(0, 10);
const over = (t) => !!t.dueDate && t.dueDate < today() && t.status !== "approved" && t.status !== "submitted";

function summary(list) {
  const total = list.length;
  const approved = list.filter((t) => t.status === "approved").length;
  return {
    total, approved,
    pending: list.filter((t) => ["assigned", "in-progress", "returned"].includes(t.status)).length,
    submitted: list.filter((t) => t.status === "submitted").length,
    overdue: list.filter(over).length,
    pct: total ? Math.round((approved / total) * 100) : 0
  };
}
const short = (u) => ({ id: u.id, name: u.name, role: u.role, title: u.title, department: u.department, subject: u.subject });
const nameOf = (id) => (byId(id) || {}).name || "Removed";

router.get("/", auth, (req, res) => {
  const me = byId(req.user.id);
  const mates = data.appmates.filter((a) => me.appmateIds.includes(a.id));
  const receivedAll = data.tasks.filter((t) => t.assigneeId === me.id);
  const focus = receivedAll
    .filter((t) => t.status !== "approved" && t.status !== "submitted")
    .sort((a, b) => String(a.dueDate || "9").localeCompare(String(b.dueDate || "9")))
    .slice(0, 5)
    .map((t) => {
      const d = { ...t, assignerName: nameOf(t.assignedBy), overdue: over(t) };
      return { ...d, suggestions: suggestFor(d, mates) };
    });

  const out = {
    me: publicUser(me),
    chain: ancestors(me.id).map(short),
    appmates: mates.map((a) => ({ ...a, profile: publicProfile(a) })),
    mine: summary(receivedAll),
    focus
  };

  if (me.role !== "student") {
    const below = descendants(me.id);
    const ids = new Set(below.map((u) => u.id));
    const subtreeTasks = data.tasks.filter((t) => ids.has(t.assigneeId));
    out.people = {
      hod: below.filter((u) => u.role === "hod").length,
      faculty: below.filter((u) => u.role === "faculty").length,
      student: below.filter((u) => u.role === "student").length,
      total: below.length
    };
    out.all = summary(subtreeTasks);
    out.team = childrenOf(me.id).map((u) => {
      const sub = new Set([u.id, ...descendants(u.id).map((x) => x.id)]);
      const tasks = data.tasks.filter((t) => sub.has(t.assigneeId));
      return { ...short(u), teamSize: descendants(u.id).length, ...summary(tasks) };
    });
    // Early warning: simple rules on overdue, returned and late work
    out.atRisk = below
      .map((u) => {
        const t = data.tasks.filter((x) => x.assigneeId === u.id);
        const overdue = t.filter(over).length;
        const returned = t.filter((x) => x.status === "returned").length;
        const late = t.filter((x) => x.submission && x.submission.late).length;
        const reasons = [];
        if (overdue) reasons.push(`${overdue} overdue`);
        if (returned) reasons.push(`${returned} returned for changes`);
        if (late) reasons.push(`${late} late submission${late > 1 ? "s" : ""}`);
        return { ...short(u), score: overdue * 3 + returned * 2 + late, reasons };
      })
      .filter((x) => x.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    out.reviews = data.tasks
      .filter((t) => t.assignedBy === me.id && t.status === "submitted")
      .map((t) => ({ id: t.id, title: t.title, assigneeName: nameOf(t.assigneeId), time: t.submission && t.submission.time }));
  }
  res.json(out);
});

module.exports = router;
