import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import Markdown from "../components/Markdown";
import MateBadge from "../components/MateBadge";
import { useToast } from "../context/ToastContext";

export default function Chat() {
  const { user, setUser } = useAuth();
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const [mates, setMates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const autoSent = useRef("");

  useEffect(() => {
    api("/appmates/mine").then(setMates);
    api("/tasks").then((t) => setTasks([...t.received, ...t.given]));
  }, []);

  const selectedId = Number(params.get("mate")) || (mates[0] && mates[0].id);
  const taskId = Number(params.get("task")) || 0;
  const ask = params.get("ask");
  const q = params.get("q");
  const current = mates.find((m) => m.id === selectedId);
  const task = tasks.find((t) => t.id === taskId);
  const profile = (current && current.profile) || { quick: [], skills: [], title: "" };

  // Load the saved conversation whenever the AppMate changes
  useEffect(() => {
    if (!selectedId) return;
    setMessages([]);
    api(`/chat/history?appmateId=${selectedId}`).then(setMessages).catch(() => {});
  }, [selectedId]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(message, useTask = true) {
    const m = (message ?? text).trim();
    if (!current || busy) return;
    if (!m && !(useTask && task)) return;
    setText("");
    if (m) setMessages((x) => [...x, { from: "me", text: m }]);
    else setMessages((x) => [...x, { from: "me", text: `Help me with this assignment: "${task.title}"` }]);
    setBusy(true);
    try {
      const r = await api("/chat", "POST", { appmateId: current.id, message: m, taskId: useTask && task ? task.id : undefined });
      setMessages((x) => [...x, { from: "ai", text: r.reply }]);
    } catch (err) {
      notify(err.message, "error");
    }
    setBusy(false);
  }

  // Opening from a task: the chosen AppMate starts working on it straight away
  useEffect(() => {
    const key = `${selectedId}-${taskId}`;
    if (current && task && autoSent.current !== key) {
      autoSent.current = key;
      send(ask === "review" ? "Review the student's submission for this assignment. Give a short summary, what is good, what is missing, a suggested mark out of 100 with a rubric breakdown, and kind feedback I can send. The final mark is my decision." : "", true);
    }
  }, [current, task]);

  // Opened with a ready question, for example from Needs attention or Announcements
  useEffect(() => {
    const key = `q-${selectedId}-${q}`;
    if (current && q && !taskId && autoSent.current !== key) {
      autoSent.current = key;
      if (/about: $/.test(q)) setText(q); else send(q, false);
    }
  }, [current]);

  async function setLanguage(e) {
    try { setUser(await api("/auth/profile", "PUT", { language: e.target.value })); } catch (err) { notify(err.message, "error"); }
  }

  async function clearChat() {
    if (!window.confirm("Clear this conversation?")) return;
    await api(`/chat/history?appmateId=${current.id}`, "DELETE");
    setMessages([]);
  }

  const choose = (id) => setParams(taskId ? { mate: id, task: taskId, ...(ask ? { ask } : {}) } : { mate: id });
  const also = task ? (task.suggestions || []).filter((s) => s.id !== selectedId) : [];
  const quick = task ? ["Give me a complete answer for this assignment", ...profile.quick.slice(0, 3)] : profile.quick;

  return (
    <>
      <PageHeader title="Ask AppMates" subtitle="Every AppMate has its own speciality. Pick the right one, or open an assignment to get a matching AppMate." />

      {mates.length === 0 ? (
        <div className="card empty">No AppMates are available for your level yet.</div>
      ) : (
        <div className="chat-layout">
          <div className="card chat-list">
            {mates.map((m) => (
              <button key={m.id} className={m.id === selectedId ? "on" : ""} onClick={() => choose(m.id)}>
                <MateBadge mate={m} size={34} />
                <span className="chat-list-text">
                  <b>{m.name}</b>
                  <span className="small-text">{(m.profile && m.profile.title) || m.department}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="card chat-box">
            <div className="chat-title">
              <MateBadge mate={current} size={44} />
              <div className="chat-title-text">
                <b>{current && current.name}</b>
                <span className="small-text">{current && current.description}</span>
                <div className="skill-row">{(profile.skills || []).map((s) => <span key={s} className="skill">{s}</span>)}</div>
              </div>
              <div className="chat-tools">
                <select value={user.language || "English"} onChange={setLanguage} title="Reply language"><option>English</option><option>Hindi</option><option>Telugu</option></select>
                {messages.length > 0 && <button className="btn light small" onClick={clearChat}>Clear</button>}
              </div>
            </div>

            {task && (
              <div className="task-banner">
                <div>
                  <span className="small-text">Working on assignment</span>
                  <b>{task.title}</b>
                  <span className={`tag ${task.priority}`}>{task.priority}</span>
                  {task.dueDate && <span className="small-text"> Due {task.dueDate}</span>}
                </div>
                <div className="task-banner-actions">
                  {also.map((s) => <Link key={s.id} className="help-chip" to={`/chat?mate=${s.id}&task=${task.id}`}>Also ask {s.name}</Link>)}
                  <Link className="help-chip" to={`/chat?mate=${selectedId}`}>Close assignment</Link>
                </div>
              </div>
            )}

            <div className="chat-messages">
              {messages.length === 0 && !busy && (
                <div className="chat-empty">
                  <MateBadge mate={current} size={56} />
                  <h3>Hello, I am {current && current.name}</h3>
                  <p className="muted">{profile.title}. Tap a suggestion below or type your own question.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.from}`}>
                  {m.from === "ai" && <MateBadge mate={current} size={30} />}
                  <div className={`bubble ${m.from}`}>
                    {m.from === "ai" ? <Markdown text={m.text} /> : m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="msg ai">
                  <MateBadge mate={current} size={30} />
                  <div className="bubble ai typing"><i /><i /><i /></div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="chips">
              {quick.map((q) => (
                <button key={q} className="chip" disabled={busy} onClick={() => send(q)}>{q}</button>
              ))}
            </div>

            <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <input placeholder={`Ask ${current ? current.name : "an AppMate"}...`} value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn" type="submit" disabled={busy}>{busy ? "Thinking..." : "Send"}</button>
            </form>
            <p className="small-text">AI answers can have mistakes. Check important details. Your chats are saved.</p>
          </div>
        </div>
      )}
    </>
  );
}
