import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import RoleTag from "../components/RoleTag";
import { useToast } from "../context/ToastContext";
import { when } from "../utils";

export default function Announcements() {
  const { user } = useAuth();
  const notify = useToast();
  const staff = user.role !== "student";
  const [list, setList] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [form, setForm] = useState({ title: "", body: "" });

  const load = () => api("/announcements").then(setList);
  useEffect(() => {
    load();
    api("/appmates/mine").then((m) => setAdmin(m.find((x) => x.name === "AdminMate") || null));
  }, []);

  async function post(e) {
    e.preventDefault();
    try {
      const a = await api("/announcements", "POST", form);
      notify(`Sent to ${a.reach} people`);
      setForm({ title: "", body: "" });
      load();
    } catch (err) { notify(err.message, "error"); }
  }
  async function remove(id) {
    if (!window.confirm("Delete this announcement?")) return;
    await api("/announcements/" + id, "DELETE");
    load();
  }

  return (
    <>
      <PageHeader title="Announcements" subtitle={staff ? "Post a notice that reaches everyone below you, down to the last level." : "Notices from the people above you."} />
      {staff && (
        <form className="card" onSubmit={post}>
          <h3>New announcement</h3>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea rows="4" style={{ marginTop: 8 }} placeholder="Write the message for everyone below you" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <div className="row-gap" style={{ marginTop: 10 }}>
            <button className="btn" type="submit">Send announcement</button>
            {admin && <Link className="btn light" to={`/chat?mate=${admin.id}&q=${encodeURIComponent("Draft a formal circular for the people below me about: ")}`}>Draft with AdminMate</Link>}
          </div>
        </form>
      )}
      <div className="card">
        {list.length === 0 && <p className="muted">No announcements yet.</p>}
        {list.map((a) => (
          <div className="announce" key={a.id}>
            <div className="assign-top">
              <div><b className="serif big-title">{a.title}</b><div className="small-text">{a.authorName} <RoleTag role={a.authorRole} /> {when(a.time)}</div></div>
              {a.mine && <button className="btn small danger" onClick={() => remove(a.id)}>Delete</button>}
            </div>
            <p className="pre">{a.body}</p>
          </div>
        ))}
      </div>
    </>
  );
}
