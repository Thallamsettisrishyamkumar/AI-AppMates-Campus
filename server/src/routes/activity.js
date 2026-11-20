const router = require("express").Router();
const { data, byId, descendants } = require("../db");
const { auth } = require("../middleware/auth");

// Own actions for everyone. Staff also see the actions of the people below them.
router.get("/", auth, (req, res) => {
  const me = byId(req.user.id);
  const ids = new Set([me.id, ...(me.role === "student" ? [] : descendants(me.id).map((u) => u.id))]);
  res.json(data.activity.filter((a) => ids.has(a.actorId)).slice(0, 120));
});

module.exports = router;
