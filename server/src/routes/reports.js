const router = require("express").Router();
const { data, byId, descendants } = require("../db");
const { auth } = require("../middleware/auth");

const today = () => new Date().toISOString().slice(0, 10);
const ROLE = { vc: "Vice Chancellor", hod: "Head of Department", faculty: "Faculty", student: "Student" };

function rowFor(u) {
  const t = data.tasks.filter((x) => x.assigneeId === u.id);
  const marked = t.filter((x) => x.review && x.review.marks !== null && x.review.marks !== undefined && x.status === "approved");
  const avg = marked.length ? Math.round(marked.reduce((s, x) => s + x.review.marks, 0) / marked.length) : null;
  return {
    id: u.id, name: u.name, role: u.role, roleLabel: ROLE[u.role], department: u.department, subject: u.subject,
    total: t.length, approved: t.filter((x) => x.status === "approved").length, submitted: t.filter((x) => x.status === "submitted").length,
    returned: t.filter((x) => x.status === "returned").length,
    overdue: t.filter((x) => x.dueDate && x.dueDate < today() && !["approved", "submitted"].includes(x.status)).length,
    late: t.filter((x) => x.submission && x.submission.late).length, avg
  };
}

function build(me) {
  const people = me.role === "student" ? [me] : descendants(me.id);
  const rows = people.map(rowFor);
  const ids = new Set(people.map((u) => u.id));
  const tasks = data.tasks.filter((t) => ids.has(t.assigneeId));
  const status = { assigned: 0, "in-progress": 0, submitted: 0, returned: 0, approved: 0 };
  tasks.forEach((t) => { status[t.status] = (status[t.status] || 0) + 1; });
  const marks = data.tasks
    .filter((t) => t.assigneeId === me.id && t.status === "approved")
    .map((t) => ({ id: t.id, title: t.title, marks: t.review ? t.review.marks : null, by: (byId(t.assignedBy) || {}).name, remarks: t.review ? t.review.remarks : "" }));
  return { rows, status, marks, total: tasks.length };
}

router.get("/", auth, (req, res) => res.json(build(byId(req.user.id))));

router.get("/export.csv", auth, (req, res) => {
  const { rows } = build(byId(req.user.id));
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Name", "Level", "Department", "Subject", "Assignments", "Approved", "Submitted", "Returned", "Overdue", "Late", "Average marks"];
  const lines = [head.map(q).join(",")].concat(rows.map((r) => [r.name, r.roleLabel, r.department, r.subject, r.total, r.approved, r.submitted, r.returned, r.overdue, r.late, r.avg === null ? "" : r.avg].map(q).join(",")));
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="report.csv"');
  res.send(lines.join("\n"));
});

module.exports = router;
