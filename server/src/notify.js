// In-app notifications for everyone, plus email when SMTP is set in .env
const { data, save, nextId, byId } = require("./db");

let mailer = null;
function getMailer() {
  if (mailer !== null) return mailer;
  if (!process.env.SMTP_HOST) return (mailer = false);
  try {
    mailer = require("nodemailer").createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === "465",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
  } catch { mailer = false; }
  return mailer;
}

function notify(userIds, text, link = "/") {
  const ids = [...new Set([].concat(userIds))].filter(Boolean);
  const m = getMailer();
  for (const id of ids) {
    data.notifications.unshift({ id: nextId(data.notifications) , userId: id, text, link, time: new Date().toISOString(), read: false });
    const u = byId(id);
    if (m && u) {
      m.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: u.email, subject: "AI AppMates Campus", text: `${text}\n\nOpen the application to see more.` }).catch(() => {});
    }
  }
  // keep the list small
  const counts = {};
  data.notifications = data.notifications.filter((n) => (counts[n.userId] = (counts[n.userId] || 0) + 1) <= 60);
  save();
}

module.exports = { notify };
