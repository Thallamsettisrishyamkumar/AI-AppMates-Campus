// Simple JSON file database. No setup needed.
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const file = path.join(__dirname, "..", "data", "db.json");

// Hierarchy: Vice Chancellor, then HOD, then Faculty, then Student (last level)
const LEVELS = ["vc", "hod", "faculty", "student"];
const ROLE_LABEL = { vc: "Vice Chancellor", hod: "Head of Department", faculty: "Faculty", student: "Student" };

// AppMates every new person gets, by level
const KITS = { vc: [9, 10, 8, 7, 11, 12], hod: [10, 1, 8, 9, 7, 6, 11, 12], faculty: [1, 2, 6, 7, 8, 11, 12], student: [3, 4, 5, 13, 7, 11, 12] };

const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function seed() {
  const hash = (p) => bcrypt.hashSync(p, 8);
  const U = (id, name, email, role, parentId, extra = {}) => ({
    id, name, email, password: hash("123456"), role, parentId,
    department: "", subject: "", title: ROLE_LABEL[role], createdAt: new Date().toISOString(), ...extra
  });
  const users = [
    U(1, "Dr. Rajesh Menon", "vc@demo.com", "vc", null, { department: "University" }),
    U(2, "Dr. Anitha Rao", "hod@demo.com", "hod", 1, { department: "Computer Science" }),
    U(3, "Dr. Suresh Babu", "hod.ece@demo.com", "hod", 1, { department: "Electronics" }),
    U(4, "Dr. Meera Nair", "hod.mgmt@demo.com", "hod", 1, { department: "Management" }),
    U(5, "Prof. Kiran Kumar", "faculty@demo.com", "faculty", 2, { department: "Computer Science", subject: "Data Structures" }),
    U(6, "Prof. Lakshmi Devi", "faculty.db@demo.com", "faculty", 2, { department: "Computer Science", subject: "Database Systems" }),
    U(7, "Prof. Ramesh Chandra", "faculty.ece@demo.com", "faculty", 3, { department: "Electronics", subject: "Digital Electronics" }),
    U(8, "Prof. Sunitha Reddy", "faculty.mgmt@demo.com", "faculty", 4, { department: "Management", subject: "Marketing" }),
    U(9, "Arjun Reddy", "student@demo.com", "student", 5, { department: "Computer Science" }),
    U(10, "Sneha Patel", "sneha@demo.com", "student", 5, { department: "Computer Science" }),
    U(11, "Rahul Verma", "rahul@demo.com", "student", 6, { department: "Computer Science" }),
    U(12, "Divya Sri", "divya@demo.com", "student", 6, { department: "Computer Science" }),
    U(13, "Karthik Rao", "karthik@demo.com", "student", 7, { department: "Electronics" }),
    U(14, "Pooja Singh", "pooja@demo.com", "student", 8, { department: "Management" })
  ].map((u) => ({ ...u, appmateIds: KITS[u.role] }));

  const M = (id, name, type, department, description) => ({ id, name, type, department, description });
  return {
    users,
    appmates: [
      M(1, "AcademicMate", "appmate", "Academics", "Builds syllabus plans, lesson plans, course outcomes and teaching material."),
      M(2, "EvalMate", "appmate", "Academics", "Creates question papers and rubrics, and reviews submitted work with feedback and marks."),
      M(3, "StudyMate", "appmate", "Students", "Explains concepts step by step, makes study plans and exam practice."),
      M(4, "ProjectMate", "appmate", "Students", "Guides project ideas, design, reports, code and viva preparation."),
      M(5, "CareerMate", "appmate", "Students", "Helps with resumes, internships, placements and interview practice."),
      M(6, "MentorMate", "appmate", "Mentoring", "Helps staff mentor students: talking points, feedback and parent communication."),
      M(7, "ResearchMate", "appmate", "Research", "Supports literature review, research proposals, paper structure and citations."),
      M(8, "AdminMate", "appmate", "Administration", "Drafts circulars, notices, letters, emails and meeting minutes."),
      M(9, "PolicyMate", "appmate", "Governance", "Guides on university policy, UGC, AICTE and NAAC compliance and academic ethics."),
      M(10, "InsightMate", "appmate", "Governance", "Turns department and institution numbers into summaries, risks and action plans."),
      M(11, "PlannerMate", "teammate-app", "General", "Plans your day and week from your real assignments."),
      M(12, "TrackMate", "taskmate-app", "General", "Tracks progress, deadlines and what needs attention."),
      M(13, "WriteMate", "appmate", "Students", "Helps structure and improve your own writing: outlines, clarity and grammar.")
    ],
    tasks: [
      { id: 1, title: "Implement a linked list with all operations", description: "Write insert, delete and search for a singly linked list in any language. Add 5 test cases and a short explanation.", assignedBy: 5, assigneeId: 9, priority: "high", status: "in-progress", dueDate: day(2), createdAt: new Date().toISOString(), submission: null, review: null },
      { id: 2, title: "Short report on sorting algorithm complexity", description: "Compare bubble, merge and quick sort with time and space complexity. One page.", assignedBy: 5, assigneeId: 10, priority: "medium", status: "assigned", dueDate: day(5), createdAt: new Date().toISOString(), submission: null, review: null },
      { id: 3, title: "Design an ER diagram for a library system", description: "Include entities, keys and relationships. Explain your choices.", assignedBy: 6, assigneeId: 11, priority: "medium", status: "assigned", dueDate: day(-1), createdAt: new Date().toISOString(), submission: null, review: null },
      { id: 4, title: "Prepare the Data Structures question bank", description: "Prepare 30 questions across 5 units with difficulty level.", assignedBy: 2, assigneeId: 5, priority: "high", status: "assigned", dueDate: day(3), createdAt: new Date().toISOString(), submission: null, review: null },
      { id: 5, title: "Submit the department annual report", description: "Prepare the yearly report with results, research and events.", assignedBy: 1, assigneeId: 2, priority: "high", status: "in-progress", dueDate: day(7), createdAt: new Date().toISOString(), submission: null, review: null }
    ],
    notifications: [], announcements: [],
    activity: [{ id: 1, time: new Date().toISOString(), actorId: 0, actor: "System", type: "system", text: "Campus demo data loaded" }],
    chats: {}
  };
}

// Storage: a JSON file by default. Set DATABASE_URL to keep everything in PostgreSQL instead.
const data = {};
const DB_URL = process.env.DATABASE_URL || "";
let pool = null;
let timer = null;
const uploads = path.join(__dirname, "..", "data", "uploads");

function pg() {
  if (!pool) {
    const { Pool } = require("pg");
    const local = /localhost|127\.0\.0\.1/.test(DB_URL);
    pool = new Pool({ connectionString: DB_URL, ssl: local ? false : { rejectUnauthorized: false } });
  }
  return pool;
}

function fixShape() {
  data.chats = data.chats || {};
  data.notifications = data.notifications || [];
  data.announcements = data.announcements || [];
  data.tasks.forEach((t) => { t.comments = t.comments || []; });
  data.users.forEach((u) => { u.language = u.language || "English"; });
}

async function writePg() {
  await pg().query("INSERT INTO app_state (id, doc) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET doc = $1", [JSON.stringify(data)]);
}

function save() {
  if (DB_URL) {
    clearTimeout(timer);
    timer = setTimeout(() => writePg().catch((e) => console.error("Database save failed:", e.message)), 400);
    return;
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function init() {
  let loaded = null;
  if (DB_URL) {
    await pg().query("CREATE TABLE IF NOT EXISTS app_state (id INT PRIMARY KEY, doc JSONB NOT NULL)");
    await pg().query("CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, name TEXT, mime TEXT, data BYTEA)");
    const r = await pg().query("SELECT doc FROM app_state WHERE id = 1");
    loaded = r.rows[0] ? r.rows[0].doc : null;
  } else if (fs.existsSync(file)) {
    loaded = JSON.parse(fs.readFileSync(file, "utf8"));
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  Object.assign(data, loaded || seed());
  fixShape();
  if (!loaded) { if (DB_URL) await writePg(); else save(); }
  if (!DB_URL) fs.mkdirSync(uploads, { recursive: true });
  console.log(DB_URL ? "Storage: PostgreSQL" : "Storage: JSON file");
}

async function flush() {
  if (DB_URL) { clearTimeout(timer); await writePg(); }
}

// Uploaded files
async function putFile(id, name, mime, buffer) {
  if (DB_URL) return pg().query("INSERT INTO files (id, name, mime, data) VALUES ($1,$2,$3,$4)", [id, name, mime, buffer]);
  fs.writeFileSync(path.join(uploads, id), buffer);
}
async function getFile(id) {
  if (DB_URL) {
    const r = await pg().query("SELECT name, mime, data FROM files WHERE id = $1", [id]);
    return r.rows[0] ? { name: r.rows[0].name, mime: r.rows[0].mime, buffer: r.rows[0].data } : null;
  }
  const f = path.join(uploads, id);
  return fs.existsSync(f) ? { buffer: fs.readFileSync(f) } : null;
}

const nextId = (list) => (list.length ? Math.max(...list.map((i) => i.id)) + 1 : 1);
const publicUser = (u) => {
  const { password, ...rest } = u;
  return rest;
};
const byId = (id) => data.users.find((u) => u.id === Number(id));
const childrenOf = (id) => data.users.filter((u) => u.parentId === id);
const levelOf = (role) => LEVELS.indexOf(role);

// Everyone below a person, at any depth
function descendants(id) {
  const out = [];
  const walk = (pid) => childrenOf(pid).forEach((c) => { out.push(c); walk(c.id); });
  walk(id);
  return out;
}
// The people above a person, nearest first
function ancestors(id) {
  const out = [];
  let u = byId(id);
  while (u && u.parentId) { u = byId(u.parentId); if (u) out.push(u); }
  return out;
}

function log(actorId, type, text) {
  const u = data.users.find((x) => x.id === actorId);
  data.activity.unshift({
    id: Date.now() + Math.random(),
    time: new Date().toISOString(),
    actorId: actorId || 0,
    actor: u ? u.name : "System",
    type,
    text
  });
  data.activity = data.activity.slice(0, 300);
  save();
}


module.exports = { data, init, flush, putFile, getFile, save, nextId, publicUser, log, byId, childrenOf, descendants, ancestors, levelOf, LEVELS, ROLE_LABEL, KITS };
