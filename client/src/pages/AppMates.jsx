import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import PageHeader from "../components/PageHeader";
import MateBadge from "../components/MateBadge";

const TYPES = [
  ["appmate", "AppMate", "A specialist for a role or subject, such as StudyMate or PolicyMate."],
  ["teammate-app", "Teammate app", "Helps you organise your day from your real assignments."],
  ["taskmate-app", "Taskmate app", "Helps you track progress and deadlines."]
];

export default function AppMates() {
  const [all, setAll] = useState([]);
  const [mine, setMine] = useState([]);

  useEffect(() => {
    api("/appmates").then(setAll);
    api("/appmates/mine").then(setMine);
  }, []);

  const mineIds = new Set(mine.map((m) => m.id));
  const others = all.filter((a) => !mineIds.has(a.id));

  const Card = ({ a, own }) => (
    <div className={`card ${own ? "" : "dim"}`} key={a.id}>
      <div className="mate-head">
        <MateBadge mate={a} />
        <div><h4>{a.name}</h4><span className="small-text">{a.profile && a.profile.title}</span></div>
      </div>
      <span className={`tag ${a.type}`}>{a.type}</span>
      <p className="muted">{a.description}</p>
      <div className="skill-row">{(a.profile ? a.profile.skills : []).map((x) => <span key={x} className="skill">{x}</span>)}</div>
      {own ? <Link className="btn small" to={`/chat?mate=${a.id}`} style={{ marginLeft: 0 }}>Ask {a.name}</Link> : <span className="small-text">Available for other levels</span>}
    </div>
  );

  return (
    <>
      <PageHeader title="AppMates" subtitle="Each AppMate has its own speciality. You get the ones made for your level." />
      <div className="grid3">
        {TYPES.map(([key, name, text]) => (
          <div className="card info" key={key}><span className={`tag ${key}`}>{name}</span><p className="muted">{text}</p></div>
        ))}
      </div>
      <h2>Available to you</h2>
      <div className="grid3">{mine.map((a) => <Card key={a.id} a={a} own />)}</div>
      {others.length > 0 && (
        <>
          <h2>Made for other levels</h2>
          <div className="grid3">{others.map((a) => <Card key={a.id} a={a} own={false} />)}</div>
        </>
      )}
    </>
  );
}
