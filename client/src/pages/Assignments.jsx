import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, download, readFile } from "../api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import TaskHelp from "../components/TaskHelp";
import RoleTag from "../components/RoleTag";
import { useToast } from "../context/ToastContext";
import { STATUS, day, when } from "../utils";

const StatusTag = ({ t }) => <span className={`status status-${t.status}`}>{STATUS[t.status]}</span>;
const size = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

function Files({ list }) {
  const notify = useToast();
  if (!list || !list.length) return null;
  return (
    <div className="files">
      {list.map((f) => (
        <button key={f.id} type="button" className="file-chip" onClick={() => download("/tasks/files/" + f.id, f.name).catch((e) => notify(e.message, "error"))}>
          {f.name} <span className="small-text">{size(f.size)}</span>
        </button>
      ))}
    </div>
  );
}

function Discussion({ t, reload }) {
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const list = t.comments || [];

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try { await api(`/tasks/${t.id}/comments`, "POST", { text }); setText(""); reload(); } catch (err) { notify(err.message, "error"); }
  }
  return (
    <div className="discussion">
      <button type="button" className="link-btn" onClick={() => setOpen(!open)}>{open ? "Hide discussion" : `Discussion (${list.length})`}</button>
      {open && (
        <div className="box">
          {list.length === 0 && <p className="small-text">No comments yet. Ask a question or share an update.</p>}
          {list.map((c) => (
            <div className="comment" key={c.id}><b>{c.name}</b> <span className="small-text">{when(c.time)}</span><div>{c.text}</div></div>
          ))}
          <form className="row-gap" onSubmit={send} style={{ marginTop: 8 }}>
            <input placeholder="Write a comment" value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn small" type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

function SubmitBox({ t, reload }) {
  const notify = useToast();
  const [text, setText] = useState(t.submission ? t.submission.text : "");
  const [link, setLink] = useState(t.submission ? t.submission.link : "");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  async function pick(e) {
    const chosen = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length + chosen.length > 3) return notify("You can attach up to 3 files", "error");
    if (chosen.some((f) => f.size > 3 * 1024 * 1024)) return notify("Each file must be smaller than 3 MB", "error");
    setFiles([...files, ...(await Promise.all(chosen.map(readFile)))]);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/tasks/${t.id}/submit`, "POST", { text, link, files: files.map(({ name, type, data }) => ({ name, type, data })) });
      notify("Work submitted to " + t.assignerName);
      reload();
    } catch (err) { notify(err.message, "error"); }
    setBusy(false);
  }

  return (
    <form className="box" onSubmit={submit}>
      <label>Your work</label>
      <textarea rows="5" placeholder="Write or paste your work here" value={text} onChange={(e) => setText(e.target.value)} />
      <label>Attach files (optional, up to 3 files, 3 MB each: PDF, images, Word, PowerPoint, Excel, zip)</label>
      <input type="file" multiple onChange={pick} />
      {files.length > 0 && (
        <div className="files">
          {files.map((f, i) => (
            <span className="file-chip" key={i}>{f.name} <span className="small-text">{size(f.size)}</span>
              <button type="button" className="x" onClick={() => setFiles(files.filter((_, n) => n !== i))}>Remove</button></span>
          ))}
        </div>
      )}
      <label>Link (optional)</label>
      <input placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
      <button className="btn" type="submit" disabled={busy} style={{ marginTop: 12 }}>{busy ? "Submitting" : `Submit to ${t.assignerName}`}</button>
    </form>
  );
}

function ReviewBox({ t, reload }) {
  const notify = useToast();
  const [remarks, setRemarks] = useState("");
  const [marks, setMarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  async function decide(decision) {
    try {
      await api(`/tasks/${t.id}/review`, "POST", { decision, remarks, marks });
      notify(decision === "approve" ? "Approved" : "Returned for changes");
      reload();
    } catch (err) { notify(err.message, "error"); }
  }
  async function suggest() {
    setBusy(true);
    try {
      const r = await api(`/tasks/${t.id}/ai-review`, "POST");
      if (r.marks !== null) setMarks(String(r.marks));
      setRemarks(r.remarks);
      setHint(r.model === "demo" ? "Demo suggestion. Add a Groq key for real reviews." : "Suggested by EvalMate. Please read and change it. The final decision is yours.");
    } catch (err) { notify(err.message, "error"); }
    setBusy(false);
  }

  return (
    <div className="box">
      <b>Submission from {t.assigneeName}</b> {t.submission.late && <span className="tag high">Late</span>}
      <div className="small-text">Attempt {t.submission.attempt}, {when(t.submission.time)}</div>
      {t.submission.text && <div className="submission">{t.submission.text}</div>}
      <Files list={t.submission.files} />
      {t.submission.link && <p><a href={t.submission.link} target="_blank" rel="noreferrer">Open the shared link</a></p>}
      <div className="row-gap" style={{ marginTop: 8 }}>
        <button className="btn light small" type="button" onClick={suggest} disabled={busy}>{busy ? "EvalMate is reading" : "Suggest marks and feedback with EvalMate"}</button>
        {t.reviewMateId && <Link className="btn ghost small" to={`/chat?mate=${t.reviewMateId}&task=${t.id}&ask=review`}>Discuss with EvalMate</Link>}
      </div>
      {hint && <p className="small-text">{hint}</p>}
      <label>Remarks for {t.assigneeName}</label>
      <textarea rows="4" placeholder="Feedback, or what needs to change" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      <div className="row-gap" style={{ marginTop: 8 }}>
        <input type="number" min="0" max="100" placeholder="Marks out of 100 (optional)" value={marks} onChange={(e) => setMarks(e.target.value)} style={{ maxWidth: 230 }} />
        <button className="btn" type="button" onClick={() => decide("approve")}>Approve</button>
        <button className="btn danger" type="button" onClick={() => decide("return")}>Return for changes</button>
      </div>
    </div>
  );
}

function ReviewResult({ t }) {
  if (!t.review) return null;
  return (
    <div className={`box result ${t.review.decision}`}>
      <b>{t.review.decision === "approve" ? "Approved" : "Returned for changes"} by {t.assignerName}</b>
      {t.review.marks !== null && <div>Marks: {t.review.marks} out of 100</div>}
      {t.review.remarks && <div className="pre">{t.review.remarks}</div>}
    </div>
  );
}

function Received({ t, reload }) {
  const notify = useToast();
  const [show, setShow] = useState(false);
  const canSubmit = ["assigned", "in-progress", "returned"].includes(t.status);
  async function start() {
    try { await api(`/tasks/${t.id}/start`, "PUT"); notify("Marked as started"); reload(); } catch (err) { notify(err.message, "error"); }
  }
  return (
    <div className={`assign ${t.overdue ? "overdue" : ""}`}>
      <div className="assign-top">
        <div>
          <b className="assign-title">{t.title}</b> <span className={`tag ${t.priority}`}>{t.priority}</span> <StatusTag t={t} />
          {t.overdue && <span className="tag high">Overdue</span>}
          <div className="small-text">From {t.assignerName}, due {day(t.dueDate)}</div>
        </div>
        <div className="assign-actions">
          {t.status === "assigned" && <button className="btn small light" onClick={start}>Start work</button>}
          {canSubmit && <button className="btn small" onClick={() => setShow(!show)}>{show ? "Close" : t.status === "returned" ? "Submit again" : "Submit work"}</button>}
        </div>
      </div>
      {t.description && <p className="muted assign-desc">{t.description}</p>}
      <TaskHelp task={t} />
      <ReviewResult t={t} />
      {t.status === "submitted" && <div className="box"><b>Submitted{t.submission.late ? " late" : ""}</b><div className="small-text">Waiting for {t.assignerName} to review. {when(t.submission.time)}</div><Files list={t.submission.files} /></div>}
      {show && canSubmit && <SubmitBox t={t} reload={() => { setShow(false); reload(); }} />}
      <Discussion t={t} reload={reload} />
    </div>
  );
}

function Given({ t, reload }) {
  const notify = useToast();
  async function remove() {
    if (!window.confirm("Delete this assignment?")) return;
    await api("/tasks/" + t.id, "DELETE");
    notify("Deleted");
    reload();
  }
  return (
    <div className={`assign ${t.overdue ? "overdue" : ""}`}>
      <div className="assign-top">
        <div>
          <b className="assign-title">{t.title}</b> <span className={`tag ${t.priority}`}>{t.priority}</span> <StatusTag t={t} />
          {t.overdue && <span className="tag high">Overdue</span>}
          <div className="small-text">To {t.assigneeName} <RoleTag role={t.assigneeRole} /> due {day(t.dueDate)}</div>
        </div>
        <button className="btn small danger" onClick={remove}>Delete</button>
      </div>
      {t.description && <p className="muted assign-desc">{t.description}</p>}
      {t.status === "submitted" && <ReviewBox t={t} reload={reload} />}
      {t.status !== "submitted" && <ReviewResult t={t} />}
      {t.status !== "submitted" && t.submission && <Files list={t.submission.files} />}
      <Discussion t={t} reload={reload} />
    </div>
  );
}

export default function Assignments() {
  const { user } = useAuth();
  const notify = useToast();
  const staff = user.role !== "student";
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "received";
  const [d, setD] = useState({ received: [], given: [], all: [] });
  const [team, setTeam] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", assigneeId: "", priority: "medium", dueDate: "" });

  const load = () => api("/tasks").then(setD);
  useEffect(() => {
    load();
    if (staff) api("/org/tree").then((t) => setTeam(t.children));
  }, []);

  async function create(e) {
    e.preventDefault();
    try {
      const r = await api("/tasks", "POST", form);
      notify(r.count > 1 ? `Assignment sent to ${r.count} people` : "Assignment sent");
      setForm({ ...form, title: "", description: "", dueDate: "" });
      load();
    } catch (err) { notify(err.message, "error"); }
  }

  const waiting = d.given.filter((t) => t.status === "submitted").length;
  const tabs = [["received", `Assigned to me (${d.received.length})`], ...(staff ? [["given", `Assigned by me (${d.given.length})${waiting ? `, ${waiting} to review` : ""}`], ["all", `Everyone below me (${(d.all || []).length})`]] : [])];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const assignLabel = { vc: "Head of Department", hod: "Faculty", faculty: "Student" }[user.role];

  return (
    <>
      <PageHeader title="Assignments" subtitle={staff ? "Assign work to the people directly below you, review what they submit, and complete the work given to you." : "See the work your faculty gave you and submit it here."} />

      {staff && (
        <form className="card" onSubmit={create}>
          <h3>Assign new work</h3>
          <div className="form-row">
            <input placeholder="Title" value={form.title} onChange={set("title")} />
            <select value={form.assigneeId} onChange={set("assigneeId")}>
              <option value="">{`Assign to ${assignLabel ? assignLabel.toLowerCase() : "a person"}`}</option>
              {team.length > 1 && <option value="all">{`Everyone directly below me (${team.length})`}</option>}
              {team.map((p) => <option key={p.id} value={p.id}>{p.name}{p.role === "faculty" && p.subject ? `, ${p.subject}` : ""}</option>)}
            </select>
            <select value={form.priority} onChange={set("priority")}>
              <option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option>
            </select>
            <input type="date" value={form.dueDate} onChange={set("dueDate")} />
          </div>
          <textarea rows="3" style={{ marginTop: 8 }} placeholder="Instructions, what to submit, marks scheme" value={form.description} onChange={set("description")} />
          <button className="btn" type="submit" style={{ marginTop: 10 }}>Send assignment</button>
          {team.length === 0 && <p className="small-text">No one directly below you yet. Add people in Organisation first.</p>}
        </form>
      )}

      <div className="tabs">
        {tabs.map(([key, label]) => <button key={key} className={tab === key ? "on" : ""} onClick={() => setParams({ tab: key })}>{label}</button>)}
      </div>

      <div className="card">
        {tab === "received" && (d.received.length === 0 ? <p className="muted">Nothing assigned to you yet.</p> : d.received.map((t) => <Received key={t.id} t={t} reload={load} />))}
        {tab === "given" && (d.given.length === 0 ? <p className="muted">You have not assigned anything yet.</p> : d.given.map((t) => <Given key={t.id} t={t} reload={load} />))}
        {tab === "all" && ((d.all || []).length === 0 ? <p className="muted">No assignments below you yet.</p> : d.all.map((t) => (
          <div className={`assign ${t.overdue ? "overdue" : ""}`} key={t.id}>
            <b className="assign-title">{t.title}</b> <StatusTag t={t} /> {t.overdue && <span className="tag high">Overdue</span>}
            <div className="small-text">{t.assignerName} to {t.assigneeName}, due {day(t.dueDate)}</div>
          </div>
        )))}
      </div>
    </>
  );
}
