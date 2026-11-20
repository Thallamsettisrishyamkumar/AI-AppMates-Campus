const router = require("express").Router();
const { data, save } = require("../db");
const { auth } = require("../middleware/auth");

router.get("/", auth, (req, res) => {
  const list = data.notifications.filter((n) => n.userId === req.user.id);
  res.json({ unread: list.filter((n) => !n.read).length, items: list.slice(0, 40) });
});
router.post("/read-all", auth, (req, res) => {
  data.notifications.forEach((n) => { if (n.userId === req.user.id) n.read = true; });
  save();
  res.json({ ok: true });
});
router.post("/:id/read", auth, (req, res) => {
  const n = data.notifications.find((x) => x.id === Number(req.params.id) && x.userId === req.user.id);
  if (n) { n.read = true; save(); }
  res.json({ ok: true });
});

module.exports = router;
