import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Organisation from "./pages/Organisation.jsx";
import Assignments from "./pages/Assignments.jsx";
import Announcements from "./pages/Announcements.jsx";
import Notifications from "./pages/Notifications.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import AppMates from "./pages/AppMates.jsx";
import Chat from "./pages/Chat.jsx";
import Activity from "./pages/Activity.jsx";
import About from "./pages/About.jsx";

function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="app">
      <header className="topbar">
        <span className="logo-mark small">AI</span>
        <b>AppMates Campus</b>
        <button className="btn ghost small" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
      </header>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <Sidebar open={open} close={() => setOpen(false)} />
      <main className="content">{children}</main>
    </div>
  );
}

const page = (el, staffOnly) => (
  <ProtectedRoute staffOnly={staffOnly}>
    <Layout>{el}</Layout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={page(<Home />)} />
      <Route path="/organisation" element={page(<Organisation />, true)} />
      <Route path="/assignments" element={page(<Assignments />)} />
      <Route path="/announcements" element={page(<Announcements />)} />
      <Route path="/notifications" element={page(<Notifications />)} />
      <Route path="/reports" element={page(<Reports />)} />
      <Route path="/settings" element={page(<Settings />)} />
      <Route path="/chat" element={page(<Chat />)} />
      <Route path="/appmates" element={page(<AppMates />)} />
      <Route path="/activity" element={page(<Activity />)} />
      <Route path="/about" element={page(<About />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
