const router = require("express").Router();
const { data, byId } = require("../db");
const { auth } = require("../middleware/auth");
const { publicProfile } = require("../personas");

const withProfile = (a) => ({ ...a, profile: publicProfile(a) });

// AppMates assigned to me, by my level
router.get("/mine", auth, (req, res) => {
  const me = byId(req.user.id);
  res.json(data.appmates.filter((a) => me.appmateIds.includes(a.id)).map(withProfile));
});

router.get("/", auth, (req, res) => res.json(data.appmates.map(withProfile)));

module.exports = router;
