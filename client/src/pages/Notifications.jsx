import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import PageHeader from "../components/PageHeader";
import { when } from "../utils";

export default function Notifications() {
  const nav = useNavigate();
  const [d, setD] = useState({ unread: 0, items: [] });
  const load = () => api("/notifications").then(setD);
  useEffect(() => { load(); }, []);

  async function open(n) {
    if (!n.read) await api(`/notifications/${n.id}/read`, "POST");
    nav(n.link || "/");
  }
  async function all() { await api("/notifications/read-all", "POST"); load(); }

  return (
    <>
      <PageHeader title="Notifications" subtitle={d.unread ? `${d.unread} unread` : "You are all caught up."}>
        {d.unread > 0 && <button className="btn light" onClick={all}>Mark all as read</button>}
      </PageHeader>
      <div className="card">
        {d.items.length === 0 && <p className="muted">Nothing yet. You will see new assignments, submissions, reviews and announcements here.</p>}
        {d.items.map((n) => (
          <button key={n.id} className={`notif ${n.read ? "" : "unread"}`} onClick={() => open(n)}>
            <span className="dot" />
            <span className="notif-text">{n.text}</span>
            <span className="small-text">{when(n.time)}</span>
          </button>
        ))}
      </div>
    </>
  );
}
