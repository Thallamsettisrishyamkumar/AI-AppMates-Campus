import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import RoleTag from "../components/RoleTag";
import MateBadge from "../components/MateBadge";
import TaskHelp from "../components/TaskHelp";
import { ROLE, day, when } from "../utils";

export default function Home() {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/dashboard").then(setD).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!d) return <p className="center">Loading</p>;

  const staff = d.me.role !== "student";
  const first = d.me.name.replace(/^(Dr|Prof)\.?\s+/i, "").split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Welcome, ${d.me.name.startsWith("Dr") || d.me.name.startsWith("Prof") ? d.me.name : first}`}
        subtitle={`${ROLE[d.me.role]}${d.me.department ? `, ${d.me.department}` : ""}${d.me.subject ? `, ${d.me.subject}` : ""}`}
      />

      {d.chain.length > 0 && (
        <div className="card chain">
          <span className="small-text">Your reporting line</span>
          <div className="chain-row">
            {d.chain.map((c) => (
              <div className="chain-item" key={c.id}>
                <RoleTag role={c.role} />
                <b>{c.name}</b>
                <span className="small-text">{c.role === "faculty" ? c.subject : c.department}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {staff ? (
        <div className="grid4">
          <StatCard label="People in your team" value={d.people.total} />
          <StatCard label="Assignments below you" value={d.all.total} tone="purple" />
          <StatCard label="Waiting for your review" value={d.reviews.length} tone="orange" />
          <StatCard label="Overdue below you" value={d.all.overdue} tone="red" />
        </div>
      ) : (
        <div className="grid4">
          <StatCard label="My assignments" value={d.mine.total} />
          <StatCard label="To do" value={d.mine.pending} tone="orange" />
          <StatCard label="Submitted" value={d.mine.submitted} tone="purple" />
          <StatCard label="Approved" value={d.mine.approved} tone="green" />
        </div>
      )}

      {staff && d.reviews.length > 0 && (
        <>
          <h2>Waiting for your review</h2>
          <div className="card">
            {d.reviews.map((r) => (
              <div className="task" key={r.id}>
                <span><b>{r.title}</b><br /><span className="small-text">Submitted by {r.assigneeName}, {when(r.time)}</span></span>
                <Link className="btn small" to="/assignments?tab=given">Review</Link>
              </div>
            ))}
          </div>
        </>
      )}

      {staff && d.atRisk && d.atRisk.length > 0 && (
        <>
          <h2>Needs attention</h2>
          <div className="card">
            <p className="small-text">Early warning based on overdue, returned and late work.</p>
            {d.atRisk.map((r) => {
              const mate = d.appmates.find((a) => a.name === "MentorMate") || d.appmates.find((a) => a.name === "InsightMate");
              const q = `Make a short support plan for ${r.name} (${ROLE[r.role]}). Current issues: ${r.reasons.join(", ")}.`;
              return (
                <div className="task" key={r.id}>
                  <span><b>{r.name}</b> <RoleTag role={r.role} /><br /><span className="small-text">{r.reasons.join(", ")}</span></span>
                  {mate && <Link className="btn small light" to={`/chat?mate=${mate.id}&q=${encodeURIComponent(q)}`}>Plan support with {mate.name}</Link>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {staff && (
        <>
          <h2>Team overview</h2>
          <div className="card table-card">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Level</th><th>People below</th><th>Assignments</th><th>Approved</th><th>Overdue</th></tr>
              </thead>
              <tbody>
                {d.team.length === 0 && <tr><td colSpan="6" className="muted">No one below you yet. Add people in Organisation.</td></tr>}
                {d.team.map((t) => (
                  <tr key={t.id}>
                    <td><b>{t.name}</b><br /><span className="small-text">{t.role === "faculty" ? t.subject : t.department}</span></td>
                    <td><RoleTag role={t.role} /></td>
                    <td>{t.teamSize}</td>
                    <td>{t.total}</td>
                    <td><div className="bar"><div className="fill" style={{ width: t.pct + "%" }} /></div><span className="small-text">{t.pct} percent</span></td>
                    <td>{t.overdue > 0 ? <span className="tag high">{t.overdue}</span> : <span className="muted">0</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>{staff ? "Your own work from above" : "What needs your attention"}</h2>
      <div className="card">
        {d.focus.length === 0 && <p className="muted">Nothing pending. You are all caught up.</p>}
        {d.focus.map((t) => (
          <div className={`task ${t.overdue ? "overdue" : ""}`} key={t.id}>
            <span>
              <b>{t.title}</b> <span className={`tag ${t.priority}`}>{t.priority}</span>
              {t.overdue && <span className="tag high">Overdue</span>}
              <br />
              <span className="small-text">From {t.assignerName}, due {day(t.dueDate)}</span>
              <TaskHelp task={t} />
            </span>
            <Link className="btn small light" to="/assignments">Open</Link>
          </div>
        ))}
      </div>

      <h2>Your AppMates</h2>
      <div className="grid3">
        {d.appmates.map((a) => (
          <div className="card" key={a.id}>
            <div className="mate-head">
              <MateBadge mate={a} />
              <div><h4>{a.name}</h4><span className="small-text">{a.profile.title}</span></div>
            </div>
            <p className="muted">{a.description}</p>
            <div className="skill-row">{a.profile.skills.map((s) => <span key={s} className="skill">{s}</span>)}</div>
            <Link className="btn small" to={`/chat?mate=${a.id}`} style={{ marginLeft: 0 }}>Ask {a.name}</Link>
          </div>
        ))}
      </div>

      <div className="card note">
        <b>Please note:</b> AppMates give guidance and drafts. Final decisions on marks, policy and approvals always stay with the people in charge.
      </div>
    </>
  );
}
