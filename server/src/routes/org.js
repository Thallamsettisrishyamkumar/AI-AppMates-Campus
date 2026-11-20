const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { data, save, nextId, publicUser, log, byId, childrenOf, descendants, ancestors, levelOf, LEVELS, ROLE_LABEL, KITS } = require("../db");
const { auth, leaderOnly } = require("../middleware/auth");

const today = () => new Date().toISOString().slice(0, 10);
const card = (u) => ({ id: u.id, name: u.name, role: u.role, title: u.title, department: u.department, subject: u.subject, email: u.email });

function stats(id) {
  const mine = data.tasks.filter((t) => t.assigneeId === id);
  return {
    open: mine.filter((t) => t.status !== "approved").length,
    overdue: mine.filter((t) => t.dueDate && t.dueDate < today() && t.status !== "approved").length
  };
}

function node(u) {
  return { ...card(u), ...stats(u.id), teamSize: descendants(u.id).length, children: childrenOf(u.id).map(node) };
}

// Who can I add, and under whom? Any level below me, under me or anyone below me.
function options(me) {
  const subtree = [me, ...descendants(me.id)];
  const out = [];
  for (let l = levelOf(me.role) + 1; l < LEVELS.length; l++) {
    const parents = subtree.filter((u) => levelOf(u.role) === l - 1).map((u) => ({ ...card(u), underName: ancestors(u.id)[0] ? ancestors(u.id)[0].name : "" }));
    if (parents.length) out.push({ role: LEVELS[l], label: ROLE_LABEL[LEVELS[l]], parents });
  }
  return out;
}

router.get("/tree", auth, (req, res) => res.json(node(byId(req.user.id))));
router.get("/chain", auth, (req, res) => res.json(ancestors(req.user.id).map(card)));
router.get("/options", auth, leaderOnly, (req, res) => res.json(options(byId(req.user.id))));

router.post("/members", auth, leaderOnly, (req, res) => {
  const me = byId(req.user.id);
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "123456");
  const role = req.body.role;
  const parentId = Number(req.body.parentId);

  if (!name || !email) return res.status(400).json({ message: "Name and email are required" });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid email" });
  if (data.users.some((u) => u.email === email)) return res.status(400).json({ message: "This email is already used" });
  if (password.length < 6) return res.status(400).json({ message: "Password must have at least 6 characters" });

  const opt = options(me).find((o) => o.role === role);
  if (!opt) return res.status(403).json({ message: "You cannot add this level" });
  const parent = opt.parents.find((p) => p.id === parentId);
  if (!parent) return res.status(400).json({ message: "Choose who this person reports to" });
  const parentUser = byId(parentId);

  let department = parentUser.department;
  if (role === "hod") {
    department = String(req.body.department || "").trim();
    if (!department) return res.status(400).json({ message: "Department is required for a Head of Department" });
  }
  const user = {
    id: nextId(data.users), name, email, password: bcrypt.hashSync(password, 8), role, parentId,
    department, subject: role === "faculty" ? String(req.body.subject || "").trim() : "",
    title: String(req.body.title || "").trim() || ROLE_LABEL[role],
    createdAt: new Date().toISOString(), appmateIds: KITS[role]
  };
  data.users.push(user);
  save();
  log(me.id, "org", `${me.name} added ${user.name} as ${ROLE_LABEL[role]} under ${parentUser.name}`);
  res.status(201).json(publicUser(user));
});

router.delete("/members/:id", auth, leaderOnly, (req, res) => {
  const me = byId(req.user.id);
  const id = Number(req.params.id);
  const target = byId(id);
  if (!target || !descendants(me.id).some((u) => u.id === id)) return res.status(404).json({ message: "Person not found in your team" });
  if (childrenOf(id).length) return res.status(400).json({ message: "Remove the people under them first" });
  data.users = data.users.filter((u) => u.id !== id);
  data.tasks = data.tasks.filter((t) => t.assigneeId !== id && t.assignedBy !== id);
  delete data.chats[id];
  save();
  log(me.id, "org", `${me.name} removed ${target.name}`);
  res.json({ ok: true });
});

// A person's password can be reset by anyone above them in the hierarchy
router.post("/members/:id/reset-password", auth, leaderOnly, (req, res) => {
  const me = byId(req.user.id);
  const target = byId(req.params.id);
  if (!target || !descendants(me.id).some((u) => u.id === target.id)) return res.status(404).json({ message: "Person not found in your team" });
  const password = String(req.body.password || "123456");
  if (password.length < 6) return res.status(400).json({ message: "Password must have at least 6 characters" });
  target.password = bcrypt.hashSync(password, 8);
  save();
  log(me.id, "account", `${me.name} reset the password of ${target.name}`);
  res.json({ ok: true, password });
});

module.exports = router;
