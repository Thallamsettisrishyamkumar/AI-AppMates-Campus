require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const db = require("./src/db");

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});
app.use(express.json({ limit: "14mb" })); // room for 3 attached files per submission

app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/org", require("./src/routes/org"));
app.use("/api/tasks", require("./src/routes/tasks"));
app.use("/api/appmates", require("./src/routes/appmates"));
app.use("/api/dashboard", require("./src/routes/dashboard"));
app.use("/api/activity", require("./src/routes/activity"));
app.use("/api/chat", require("./src/routes/chat"));
app.use("/api/notifications", require("./src/routes/notifications"));
app.use("/api/announcements", require("./src/routes/announcements"));
app.use("/api/reports", require("./src/routes/reports"));
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve the built website when deployed
const dist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (req, res, next) => res.sendFile(path.join(dist, "index.html"), (e) => e && next()));

const PORT = process.env.PORT || 5000;
db.init()
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch((e) => { console.error("Could not start:", e.message); process.exit(1); });

for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => db.flush().finally(() => process.exit(0)));
