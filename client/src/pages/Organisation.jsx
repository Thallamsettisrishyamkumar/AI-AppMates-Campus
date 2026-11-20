import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import RoleTag from "../components/RoleTag";
import { useToast } from "../context/ToastContext";
import { LEVELS, ROLE } from "../utils";

const EMPTY = { name: "", email: "", password: "", department: "", subject: "", role: "", parentId: "" };

function Node({ n, depth, me, open, toggle, onAdd, onRemove, onReset, canAddBelow }) {
  const isOpen = open.has(n.id);
  const hasKids = n.children.length > 0;
  return (
    <div className="org-node">
      <div className={`org-row ${n.id === me ? "me" : ""}`} style={{ marginLeft: depth * 26 }}>
        <button type="button" className="org-toggle" onClick={() => hasKids && toggle(n.id)} disabled={!hasKids}>
          {hasKids ? (isOpen ? "Hide" : "Show") : "Last"}
        </button>
        <div className="org-main">
          <b>{n.name}</b> <RoleTag role={n.role} />
          <div className="small-text">
            {n.role === "faculty" ? n.subject || "Faculty" : n.department || n.title}
            {n.teamSize > 0 ? `, ${n.teamSize} people below` : ""}
            {`, ${n.open} open assignments`}
            {n.overdue > 0 ? `, ${n.overdue} overdue` : ""}
          </div>
        </div>
        <div className="org-actions">
          {canAddBelow(n) && <button type="button" className="btn small light" onClick={() => onAdd(n)}>Add below</button>}
          {n.id !== me && <button type="button" className="btn small ghost" onClick={() => onReset(n)}>Reset password</button>}
          {n.id !== me && n.children.length === 0 && <button type="button" className="btn small danger" onClick={() => onRemove(n)}>Remove</button>}
        </div>
      </div>
      {isOpen && n.children.map((c) => (
        <Node key={c.id} n={c} depth={depth + 1} me={me} open={open} toggle={toggle} onAdd={onAdd} onRemove={onRemove} onReset={onReset} canAddBelow={canAddBelow} />
      ))}
    </div>
  );
}

export default function Organisation() {
  const { user } = useAuth();
  const notify = useToast();
  const [tree, setTree] = useState(null);
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(new Set());
  const [form, setForm] = useState(EMPTY);
  const formRef = useRef(null);

  const load = async () => {
    const [t, o] = await Promise.all([api("/org/tree"), api("/org/options")]);
    setTree(t);
    setOptions(o);
    setOpen((cur) => {
      if (cur.size) return cur;
      const s = new Set([t.id]);
      t.children.forEach((c) => s.add(c.id));
      return s;
    });
  };
  useEffect(() => { load(); }, []);

  const opt = options.find((o) => o.role === form.role);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (id) => setOpen((s) => { const x = new Set(s); x.has(id) ? x.delete(id) : x.add(id); return x; });

  // A person can have people added below them if the next level is allowed for me
  const canAddBelow = (n) => {
    const next = LEVELS[LEVELS.indexOf(n.role) + 1];
    const o = options.find((x) => x.role === next);
    return !!o && o.parents.some((p) => p.id === n.id);
  };
  function onAdd(n) {
    const next = LEVELS[LEVELS.indexOf(n.role) + 1];
    setForm({ ...EMPTY, role: next, parentId: String(n.id) });
    setOpen((s) => new Set(s).add(n.id));
    formRef.current && formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function add(e) {
    e.preventDefault();
    try {
      const p = await api("/org/members", "POST", { ...form, parentId: Number(form.parentId) });
      notify(`${p.name} added`);
      setOpen((s) => new Set(s).add(Number(form.parentId)));
      setForm({ ...EMPTY, role: form.role, parentId: form.parentId });
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function onRemove(n) {
    if (!window.confirm(`Remove ${n.name}? Their assignments will also be removed.`)) return;
    try {
      await api("/org/members/" + n.id, "DELETE");
      notify("Removed");
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function onReset(n) {
    const pass = window.prompt(`New temporary password for ${n.name} (at least 6 characters)`, "123456");
    if (!pass) return;
    try { await api(`/org/members/${n.id}/reset-password`, "POST", { password: pass }); notify(`Password reset for ${n.name}`); } catch (err) { notify(err.message, "error"); }
  }

  if (!tree) return <p className="center">Loading</p>;

  return (
    <>
      <PageHeader title="Organisation" subtitle="Your hierarchy from the top to the last level. Add people at any level below you. The last level is Student." />

      <form className="card" onSubmit={add} ref={formRef}>
        <h3>Add a person</h3>
        {options.length === 0 ? (
          <p className="muted">There is no level below you to add.</p>
        ) : (
          <>
            <div className="form-row">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, parentId: "" })}>
                <option value="">Level</option>
                {options.map((o) => <option key={o.role} value={o.role}>{o.label}</option>)}
              </select>
              <select value={form.parentId} onChange={set("parentId")} disabled={!opt}>
                <option value="">Reports to</option>
                {opt && opt.parents.map((p) => <option key={p.id} value={p.id}>{p.name}, {ROLE[p.role]}{p.department ? `, ${p.department}` : ""}</option>)}
              </select>
              <input placeholder="Full name" value={form.name} onChange={set("name")} />
              <input placeholder="Email" value={form.email} onChange={set("email")} />
            </div>
            <div className="form-row" style={{ marginTop: 8 }}>
              {form.role === "hod" && <input placeholder="Department name" value={form.department} onChange={set("department")} />}
              {form.role === "faculty" && <input placeholder="Subject taught" value={form.subject} onChange={set("subject")} />}
              <input placeholder="Temporary password (default 123456)" value={form.password} onChange={set("password")} />
              <button className="btn" type="submit">Add person</button>
            </div>
            <p className="small-text">The person gets the AppMates for their level automatically. You can also use Add below on any person in the list.</p>
          </>
        )}
      </form>

      <div className="card">
        <h3>Hierarchy</h3>
        <div className="org-tree">
          <Node n={tree} depth={0} me={user.id} open={open} toggle={toggle} onAdd={onAdd} onRemove={onRemove} onReset={onReset} canAddBelow={canAddBelow} />
        </div>
      </div>
    </>
  );
}
