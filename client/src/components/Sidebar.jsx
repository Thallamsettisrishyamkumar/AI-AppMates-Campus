import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { ROLE } from "../utils";

export default function Sidebar({ open, close }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const staff = user.role !== "student";
  const [unread, setUnread] = useState(0);
  const [theme, setTheme] = useState(document.documentElement.getAttribute("data-theme") || "light");

  useEffect(() => {
    const load = () => api("/notifications").then((d) => setUnread(d.unread)).catch(() => {});
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  function flip() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  }

  const groups = [
    ["Overview", [["/", staff ? "Home" : "My Workspace"], ["/notifications", "Notifications", unread]]],
    ["Work", [...(staff ? [["/organisation", "Organisation"]] : []), ["/assignments", "Assignments"], ["/announcements", "Announcements"]]],
    ["Intelligence", [["/chat", "Ask AppMates"], ["/appmates", "AppMates"], ["/reports", staff ? "Reports" : "My Marks"]]],
    ["Account", [["/activity", staff ? "Activity Log" : "My Activity"], ["/settings", "Settings"], ["/about", "How it works"]]]
  ];

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="logo">
        <span className="logo-mark">AI</span>
        <span>AppMates<small>Campus platform</small></span>
      </div>
      <nav>
        {groups.map(([label, items]) => (
          <div className="nav-group" key={label}>
            <div className="nav-label">{label}</div>
            {items.map(([to, text, count]) => (
              <NavLink key={to} to={to} end={to === "/"} className="side-link" onClick={close}>
                <span>{text}</span>
                {count > 0 && <span className="count">{count > 99 ? "99+" : count}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="side-bottom">
        <button className="side-theme" onClick={flip}>{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</button>
        <div className="side-user">
          <div className="avatar">{user.name.replace(/^(Dr|Prof)\.?\s+/i, "")[0]}</div>
          <div>
            <b>{user.name}</b>
            <div className="small-text light-text">{ROLE[user.role]}{user.department ? `, ${user.department}` : ""}</div>
          </div>
        </div>
        <button className="btn ghost full" onClick={() => { logout(); nav("/login"); }}>Logout</button>
      </div>
    </aside>
  );
}
