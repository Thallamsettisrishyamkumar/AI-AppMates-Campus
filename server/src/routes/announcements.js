const router = require("express").Router();
const { data, save, nextId, log, byId, descendants, ancestors } = require("../db");
const { auth, leaderOnly } = require("../middleware/auth");
const { notify } = require("../notify");

// Everyone sees announcements from the people above them, and their own
router.get("/", auth, (req, res) => {
  const me = byId(req.user.id);
  const ids = new Set([me.id, ...ancestors(me.id).map((u) => u.id)]);
  res.json(data.announcements.filter((a) => ids.has(a.authorId)).map((a) => ({ ...a, mine: a.authorId === me.id })).slice(0, 50));
});

router.post("/", auth, leaderOnly, (req, res) => {
  const me = byId(req.user.id);
  const title = String(req.body.title || "").trim().slice(0, 150);
  const body = String(req.body.body || "").trim().slice(0, 4000);
  if (!title || !body) return res.status(400).json({ message: "Title and message are required" });
  const below = descendants(me.id);
  const a = { id: nextId(data.announcements), authorId: me.id, authorName: me.name, authorRole: me.role, title, body, time: new Date().toISOString(), reach: below.length };
  data.announcements.unshift(a);
  data.announcements = data.announcements.slice(0, 200);
  save();
  notify(below.map((u) => u.id), `New announcement from ${me.name}: ${title}`, "/announcements");
  log(me.id, "announce", `${me.name} posted the announcement "${title}" to ${below.length} people`);
  res.status(201).json(a);
});

router.delete("/:id", auth, leaderOnly, (req, res) => {
  const a = data.announcements.find((x) => x.id === Number(req.params.id));
  if (!a || a.authorId !== req.user.id) return res.status(404).json({ message: "Announcement not found" });
  data.announcements = data.announcements.filter((x) => x.id !== a.id);
  save();
  res.json({ ok: true });
});

module.exports = router;
