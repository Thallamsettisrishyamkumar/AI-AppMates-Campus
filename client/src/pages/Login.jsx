import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEMOS = [
  ["Vice Chancellor", "Dr. Rajesh Menon", "vc@demo.com"],
  ["Head of Department", "Dr. Anitha Rao, Computer Science", "hod@demo.com"],
  ["Faculty", "Prof. Kiran Kumar, Data Structures", "faculty@demo.com"],
  ["Student", "Arjun Reddy", "student@demo.com"]
];
const LEVELS = [
  ["Vice Chancellor", "Leads the university and sees every department."],
  ["Head of Department", "Assigns work to faculty and tracks the department."],
  ["Faculty", "Assigns work to students and reviews what they submit."],
  ["Student", "Submits work to the faculty inside the application."]
];

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("vc@demo.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  async function go(mail, pass) {
    setError("");
    try {
      await login(mail, pass);
      nav("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-page">
      <section className="login-left">
        <h1>AI AppMates Campus</h1>
        <p className="big">One connected workflow from the Vice Chancellor to every student.</p>
        {LEVELS.map(([name, text], i) => (
          <div className="login-point level-row" key={name}>
            <span className="level-no">{i + 1}</span>
            <div><b>{name}</b><p>{text}</p></div>
          </div>
        ))}
        <p className="small-text light-text">Every level gets AppMates made for its role.</p>
      </section>

      <section className="login-right">
        <form className="card login" onSubmit={(e) => { e.preventDefault(); go(email, password); }}>
          <h2>Sign in</h2>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="error">{error}</p>}
          <button className="btn full" type="submit">Sign in</button>
          <hr />
          <p className="small-text">Quick demo sign in, password 123456</p>
          {DEMOS.map(([role, who, mail]) => (
            <button type="button" key={mail} className="btn light demo-btn" onClick={() => go(mail, "123456")}>
              <b>{role}</b><span>{who}</span>
            </button>
          ))}
        </form>
      </section>
    </div>
  );
}
