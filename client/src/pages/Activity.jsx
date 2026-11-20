import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import { when } from "../utils";

const TYPES = [["all", "All"], ["task", "Assigned"], ["submit", "Submitted"], ["review", "Reviewed"], ["chat", "AppMates"], ["org", "People"]];

export default function Activity() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [type, setType] = useState("all");

  useEffect(() => {
    const load = () => api("/activity").then(setList);
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const shown = list.filter((a) => type === "all" || a.type === type);

  return (
    <>
      <PageHeader title={user.role === "student" ? "My Activity" : "Activity Log"} subtitle={user.role === "student" ? "What you did in the application." : "What you and the people below you did. It refreshes by itself."} />
      <div className="tabs">
        {TYPES.map(([k, l]) => <button key={k} className={type === k ? "on" : ""} onClick={() => setType(k)}>{l}</button>)}
      </div>
      <div className="card">
        {shown.length === 0 && <p className="muted">No activity yet.</p>}
        {shown.map((a) => (
          <div className="log-row" key={a.id}>
            <span className={`log-type log-${a.type}`}>{a.type}</span>
            <span className="log-text">{a.text}</span>
            <span className="small-text">{when(a.time)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
