const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "dev_secret";

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "8h" });
}

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please login" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Login again" });
  }
}

// Every level except student can add people and assign work
function leaderOnly(req, res, next) {
  if (req.user.role === "student") return res.status(403).json({ message: "Only staff can do this" });
  next();
}

module.exports = { sign, auth, leaderOnly };
