import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import RoleTag from "../components/RoleTag";
import { useToast } from "../context/ToastContext";

export default function Settings() {
  const { user, setUser } = useAuth();
  const notify = useToast();
  const [pw, setPw] = useState({ current: "", next: "", again: "" });
  const [theme, setTheme] = useState(document.documentElement.getAttribute("data-theme") || "light");

  async function language(e) {
    try { setUser(await api("/auth/profile", "PUT", { language: e.target.value })); notify("AppMates will now reply in " + e.target.value); } catch (err) { notify(err.message, "error"); }
  }
  async function changePw(e) {
    e.preventDefault();
    if (pw.next !== pw.again) return notify("The new passwords do not match", "error");
    try { await api("/auth/password", "POST", { current: pw.current, next: pw.next }); notify("Password changed"); setPw({ current: "", next: "", again: "" }); } catch (err) { notify(err.message, "error"); }
  }
  function pick(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
    setTheme(t);
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account, language and look." />
      <div className="grid2">
        <div className="card">
          <h3>Profile</h3>
          <p><b>{user.name}</b> <RoleTag role={user.role} /></p>
          <p className="muted">{user.email}{user.department ? `, ${user.department}` : ""}{user.subject ? `, ${user.subject}` : ""}</p>
          <label>AppMate reply language</label>
          <select value={user.language || "English"} onChange={language}>
            <option>English</option><option>Hindi</option><option>Telugu</option>
          </select>
          <p className="small-text">Code and technical terms stay in English. The screens themselves are in English.</p>
          <label>Appearance</label>
          <div className="row-gap">
            <button className={`btn ${theme === "light" ? "" : "light"}`} onClick={() => pick("light")}>Light</button>
            <button className={`btn ${theme === "dark" ? "" : "light"}`} onClick={() => pick("dark")}>Dark</button>
          </div>
        </div>
        <form className="card" onSubmit={changePw}>
          <h3>Change password</h3>
          <label>Current password</label><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <label>New password</label><input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <label>Repeat new password</label><input type="password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} />
          <button className="btn" type="submit" style={{ marginTop: 12 }}>Update password</button>
          <p className="small-text">Forgot your password? Ask the person above you. They can reset it from the Organisation page.</p>
        </form>
      </div>
      <div className="card note">
        <b>Install on your phone.</b> Open this site in your phone browser, then use the browser menu and choose Add to Home screen. It opens like an app.
      </div>
    </>
  );
}
