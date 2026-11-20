import { Link } from "react-router-dom";

// Shows which AppMates can help with an assignment. One tap opens the chat with it loaded.
export default function TaskHelp({ task }) {
  const list = task.suggestions || [];
  if (!list.length || task.status === "approved" || task.status === "submitted") return null;
  return (
    <div className="task-help">
      <span className="small-text">Get help from</span>
      {list.map((s) => (
        <Link key={s.id} to={`/chat?mate=${s.id}&task=${task.id}`} className={`help-chip ${s.primary ? "best" : ""}`} title={s.reason}>
          {s.name}{s.primary && <em>Best match</em>}
        </Link>
      ))}
    </div>
  );
}
