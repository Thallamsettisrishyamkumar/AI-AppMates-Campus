const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { data, save, publicUser, log, byId } = require("../db");
const { sign, auth } = require("../middleware/auth");

// Simple protection against password guessing: 8 wrong tries per 10 minutes per email
const fails = new Map();
const blocked = (key) => {
  const f = fails.get(key);
  return f && f.count >= 8 && Date.now() - f.first < 10 * 60 * 1000;
};
const fail = (key) => {
  const f = fails.get(key);
  if (!f || Date.now() - f.first > 10 * 60 * 1000) fails.set(key, { count: 1, first: Date.now() });
  else f.count++;
};

router.post("/login", (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  if (blocked(email)) return res.status(429).json({ message: "Too many wrong tries. Please wait 10 minutes" });
  const user = data.users.find((u) => u.email === email);
  if (!user || !bcrypt.compareSync(req.body.password || "", user.password)) {
    fail(email);
    return res.status(400).json({ message: "Wrong email or password" });
  }
  fails.delete(email);
  res.json({ token: sign(user), user: publicUser(user) });
});

router.get("/me", auth, (req, res) => {
  const user = byId(req.user.id);
  if (!user) return res.status(401).json({ message: "User not found" });
  res.json(publicUser(user));
});

router.post("/password", auth, (req, res) => {
  const user = byId(req.user.id);
  const { current, next } = req.body;
  if (!bcrypt.compareSync(current || "", user.password)) return res.status(400).json({ message: "Current password is wrong" });
  if (String(next || "").length < 6) return res.status(400).json({ message: "New password must have at least 6 characters" });
  user.password = bcrypt.hashSync(next, 8);
  save();
  log(user.id, "account", `${user.name} changed their password`);
  res.json({ ok: true });
});

router.put("/profile", auth, (req, res) => {
  const user = byId(req.user.id);
  if (["English", "Hindi", "Telugu"].includes(req.body.language)) user.language = req.body.language;
  save();
  res.json(publicUser(user));
});

module.exports = router;
