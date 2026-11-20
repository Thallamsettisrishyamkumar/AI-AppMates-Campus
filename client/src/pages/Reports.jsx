import { useEffect, useState } from "react";
import { api, download } from "../api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import RoleTag from "../components/RoleTag";
import { useToast } from "../context/ToastContext";
import { STATUS } from "../utils";

const ORDER = ["approved", "submitted", "in-progress", "assigned", "returned"];

export default function Reports() {
  const { user } = useAuth();
  const notify = useToast();
  const staff = user.role !== "student";
  const [d, setD] = useState(null);
  useEffect(() => { api("/reports").then(setD); }, []);
  if (!d) return <p className="center">Loading</p>;

  const total = d.total || 1;
  const avgRows = d.rows.filter((r) => r.avg !== null).sort((a, b) => b.avg - a.avg).slice(0, 10);
  const myAvg = d.marks.filter((m) => m.marks !== null).length ? Math.round(d.marks.filter((m) => m.marks !== null).reduce((s, m) => s + m.marks, 0) / d.marks.filter((m) => m.marks !== null).length) : null;

  return (
    <>
      <PageHeader title={staff ? "Reports" : "My Marks"} subtitle={staff ? "Progress and marks for everyone below you." : "Your approved work and marks."}>
        {staff && (
          <div className="row-gap no-print">
            <button className="btn light" onClick={() => download("/reports/export.csv", "report.csv").catch((e) => notify(e.message, "error"))}>Download CSV</button>
            <button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
          </div>
        )}
      </PageHeader>

      {staff && (
        <>
          <div className="card">
            <h3>Work status across your team</h3>
            <div className="stack-bar">
              {ORDER.map((k) => d.status[k] > 0 && <div key={k} className={`seg seg-${k}`} style={{ width: (d.status[k] / total) * 100 + "%" }} title={`${STATUS[k]}: ${d.status[k]}`} />)}
            </div>
            <div className="legend">
              {ORDER.map((k) => <span key={k}><i className={`swatch seg-${k}`} />{STATUS[k]} {d.status[k] || 0}</span>)}
            </div>
          </div>

          <div className="card">
            <h3>Average marks</h3>
            {avgRows.length === 0 ? <p className="muted">No marks yet. Marks appear after work is approved with marks.</p> : avgRows.map((r) => (
              <div className="hbar" key={r.id}>
                <span className="hbar-name">{r.name}</span>
                <div className="bar wide"><div className="fill" style={{ width: r.avg + "%" }} /></div>
                <b>{r.avg}</b>
              </div>
            ))}
          </div>

          <div className="card table-card">
            <table className="table">
              <thead><tr><th>Name</th><th>Level</th><th>Work</th><th>Approved</th><th>Submitted</th><th>Returned</th><th>Overdue</th><th>Late</th><th>Average</th></tr></thead>
              <tbody>
                {d.rows.length === 0 && <tr><td colSpan="9" className="muted">No one below you yet.</td></tr>}
                {d.rows.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.name}</b><br /><span className="small-text">{r.role === "faculty" ? r.subject : r.department}</span></td>
                    <td><RoleTag role={r.role} /></td>
                    <td>{r.total}</td><td>{r.approved}</td><td>{r.submitted}</td><td>{r.returned}</td>
                    <td>{r.overdue > 0 ? <span className="tag high">{r.overdue}</span> : 0}</td><td>{r.late}</td>
                    <td>{r.avg === null ? "None" : r.avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>{staff ? "My own marks" : "Approved work"}</h2>
      <div className="card">
        {myAvg !== null && <p className="muted">Your average: <b>{myAvg}</b> out of 100</p>}
        {d.marks.length === 0 && <p className="muted">No approved work yet.</p>}
        {d.marks.map((m) => (
          <div className="task" key={m.id}>
            <span><b>{m.title}</b><br /><span className="small-text">Reviewed by {m.by}{m.remarks ? `. ${m.remarks}` : ""}</span></span>
            <b className="score">{m.marks === null ? "No marks" : m.marks}</b>
          </div>
        ))}
      </div>
    </>
  );
}
