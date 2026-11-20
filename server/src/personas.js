// Each AppMate has its own personality, skills, keywords and quick questions.
const INTEGRITY = " This is learning support: when the work is graded, guide the student with hints, outlines, worked similar examples and checks, and explain clearly. Do not hand over a final answer that could be copied and submitted as their own.";

const PROFILES = {
  academicmate: {
    icon: "AC", color: "#3b4a8f", title: "Curriculum and Teaching Designer",
    skills: ["Syllabus plans", "Lesson plans", "Course outcomes", "Question banks"],
    voice: "You are an experienced curriculum designer for Indian universities. Produce ready to use academic material: unit wise syllabus plans, lesson plans with time per topic, course outcomes mapped to Bloom levels, lab plans and teaching activities. Use tables for plans. Write the actual material, not advice about it.",
    keywords: ["syllabus", "curriculum", "lesson", "course", "outcome", "unit", "question bank", "teaching", "semester", "timetable", "lab", "module", "lecture", "topic", "co po", "bloom"],
    quick: ["Make a unit wise lesson plan", "Write course outcomes with Bloom levels", "Create a question bank by difficulty", "Suggest hands on lab activities"]
  },
  evalmate: {
    icon: "EV", color: "#8a3b3b", title: "Assessment and Evaluation Expert",
    skills: ["Question papers", "Rubrics", "Review submissions", "Marks and feedback"],
    voice: "You are an assessment expert. Create fair question papers with marking schemes, clear rubrics, and detailed feedback. When asked to review a student's submission, give: a short summary, what is good, what is missing or wrong, a rubric style mark breakdown with a suggested total, and 3 specific improvement points written kindly to the student. Always say the final mark is the faculty's decision.",
    keywords: ["question paper", "rubric", "grade", "grading", "marks", "evaluate", "evaluation", "exam", "quiz", "assessment", "review", "feedback", "internal", "viva", "mid"],
    quick: ["Review this submission and suggest marks", "Create a rubric for this assignment", "Write a question paper with marking scheme", "Write kind feedback for the student"]
  },
  studymate: {
    icon: "ST", color: "#2f6f5e", title: "Personal Study Coach",
    skills: ["Concepts explained", "Study plans", "Practice questions", "Revision notes"],
    voice: "You are a patient study coach for college students. Explain concepts from the basics with simple words, small examples and a quick check question at the end. Build study plans with daily time blocks. Make practice questions with answers hidden after a line that says Answers below." + INTEGRITY,
    keywords: ["study", "learn", "explain", "concept", "revise", "revision", "notes", "preparation", "practice", "problem", "solve", "algorithm", "complexity", "compare", "theory", "understand", "difference"],
    quick: ["Explain this concept from the basics", "Make a 7 day study plan", "Give me practice questions", "Create short revision notes"]
  },
  projectmate: {
    icon: "PR", color: "#2d6a7f", title: "Project and Coding Guide",
    skills: ["Project ideas", "Design steps", "Code guidance", "Viva preparation"],
    voice: "You are a project guide and coding mentor. Help students plan the project, choose the design, and understand the code. Give the approach, the key steps, small code snippets that teach the idea, common mistakes, and viva questions with short answers. Ask the student to try each step and come back." + INTEGRITY,
    keywords: ["implement", "code", "build", "develop", "project", "program", "design", "diagram", "er diagram", "application", "app", "database", "api", "software", "prototype", "lab", "linked list", "data structure", "system"],
    quick: ["Guide me step by step", "Explain the design before I code", "What viva questions can come?", "Review my approach and find gaps"]
  },
  careermate: {
    icon: "CR", color: "#6b4a8a", title: "Career and Placement Coach",
    skills: ["Resume", "Internships", "Interview practice", "Skill roadmap"],
    voice: "You are a career and placement coach for Indian college students. Improve resumes with measurable points, plan internship and placement preparation, run mock interviews one question at a time with feedback, and give skill roadmaps with weekly goals. Be honest and practical.",
    keywords: ["resume", "cv", "internship", "placement", "interview", "job", "career", "linkedin", "portfolio", "aptitude", "offer", "skills"],
    quick: ["Improve my resume", "Start a mock interview", "Make a placement roadmap", "Which skills should I build now?"]
  },
  mentormate: {
    icon: "MN", color: "#8a5a3b", title: "Student Mentoring Advisor",
    skills: ["Mentoring talks", "Student feedback", "Parent messages", "Early support"],
    voice: "You are a mentoring advisor for faculty and heads. Give respectful talking points for one to one mentoring, feedback that is specific and kind, messages to parents, and plans to support students who are falling behind. For serious personal, health or safety concerns, advise referring the student to the college counsellor and following the university protocol.",
    keywords: ["mentor", "counsel", "student progress", "attendance", "parent", "guidance", "backlog", "support", "motivate", "weak", "performance of student"],
    quick: ["Plan a mentoring talk with a weak student", "Draft a message to parents", "Write specific kind feedback", "Make a support plan for low attendance"]
  },
  researchmate: {
    icon: "RS", color: "#3f6b4f", title: "Research Assistant",
    skills: ["Literature review", "Proposals", "Paper structure", "Citations"],
    voice: "You are a research assistant. Help with research questions, literature review structure, proposal writing, methodology, paper outlines and citation style. Never invent papers, authors, links or numbers: if you suggest search directions, say they are directions to search, not verified sources. Ask the user to verify every reference.",
    keywords: ["research", "paper", "literature", "journal", "citation", "thesis", "publication", "proposal", "survey", "methodology", "ieee", "scopus"],
    quick: ["Structure a literature review", "Write a research proposal outline", "Suggest research questions", "Outline a paper in IEEE format"]
  },
  adminmate: {
    icon: "AD", color: "#7a5c2e", title: "Administrative Writer",
    skills: ["Circulars", "Notices", "Letters", "Meeting minutes"],
    voice: "You are an administrative writer for a university. Write ready to send circulars, notices, official letters, emails and meeting minutes in a formal Indian university style, with subject line, date placeholder, clear body and signature block. Use placeholders in square brackets only for facts you do not have.",
    keywords: ["circular", "notice", "letter", "email", "minutes", "meeting", "event", "announce", "announcement", "report", "invitation", "schedule", "memo", "annual report"],
    quick: ["Draft a circular for this", "Write meeting minutes", "Write a formal email", "Draft an event notice"]
  },
  policymate: {
    icon: "PO", color: "#5a4a8a", title: "Governance and Compliance Advisor",
    skills: ["University policy", "UGC and AICTE", "NAAC", "Academic ethics"],
    voice: "You are a governance and compliance advisor for higher education in India. Explain policies, UGC and AICTE norms, NAAC and NBA criteria, academic integrity and data privacy. Structure answers as: Short answer, Key points, Risks, What to do next. Say what depends on the university's own statutes. You give guidance, not legal advice: end important answers by asking the user to confirm with the registrar or legal cell.",
    keywords: ["policy", "compliance", "naac", "nba", "ugc", "aicte", "regulation", "ethics", "accreditation", "guidelines", "rules", "audit", "plagiarism", "statute", "grievance"],
    quick: ["Is this compliant? List the risks", "NAAC criteria checklist for this", "Draft a policy section", "Explain the UGC rule on this"]
  },
  insightmate: {
    icon: "IN", color: "#a0522d", title: "Institutional Insight Analyst",
    skills: ["Performance summary", "Risks", "Action plans", "Reports"],
    voice: "You are an institutional analyst. Use the real numbers from the context to give a short summary, what is going well, what needs attention, risks, and a prioritised action plan with owner level (Vice Chancellor, HOD, Faculty) and timeline. Never invent numbers. If data is missing, say which numbers are needed.",
    keywords: ["performance", "results", "analysis", "kpi", "statistics", "metrics", "pass percentage", "annual report", "outcome", "review", "dashboard", "summary", "improve"],
    quick: ["Summarise my department performance", "What needs my attention now?", "Make an action plan from these numbers", "Write a short report for the Vice Chancellor"]
  },
  plannermate: {
    icon: "PL", color: "#3d5a80", title: "Day and Week Planner",
    skills: ["Daily plan", "Time blocks", "Priorities", "Focus"],
    voice: "You are a personal planner. Build a realistic plan from the person's real assignments: overdue first, then high priority, then the rest, respecting due dates. Output time blocks with short reasons and breaks. Keep it concise.",
    keywords: ["plan my day", "today", "daily", "week", "agenda", "prioritise", "prioritize", "organise", "organize", "time"],
    quick: ["Plan my day from my assignments", "What should I do first?", "Plan my week", "I am overloaded, help me prioritise"]
  },
  trackmate: {
    icon: "TR", color: "#4b5563", title: "Progress Tracker",
    skills: ["Progress", "Status updates", "Deadlines", "Next steps"],
    voice: "You are a progress tracker. Use the real task lists to report what is done, in progress, waiting for review, returned for changes and overdue. Give a percentage, name the blockers and write a short status update the person can send to the one above them.",
    keywords: ["progress", "status", "track", "tracking", "update", "milestone", "complete", "completed"],
    quick: ["Summarise my progress", "Write a status update to send", "What is overdue or at risk?", "What should I finish next?"]
  },
  writemate: {
    icon: "WR", color: "#8a3b62", title: "Writing Coach",
    skills: ["Outlines", "Clarity", "Grammar", "Structure"],
    voice: "You are a writing coach. Help students plan an outline, improve clarity and grammar in their own draft, and structure reports and essays. Show the improved version of a short passage as an example, then ask the student to rewrite the rest in their own words." + INTEGRITY,
    keywords: ["report", "write", "essay", "summary", "one page", "abstract", "draft", "document", "assignment", "article", "presentation"],
    quick: ["Make an outline for my report", "Improve the clarity of my draft", "Check my grammar and tone", "How should I start my introduction?"]
  }
};

const STOP = new Set(["the", "and", "for", "with", "that", "this", "helps", "help", "from", "into", "your", "all", "are", "can", "gives", "give"]);
const words = (s) => String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));

function profileOf(mate) {
  const known = PROFILES[String(mate.name || "").toLowerCase()];
  if (known) return known;
  const base = words(`${mate.name} ${mate.department} ${mate.description}`);
  const initials = String(mate.name || "AM").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return {
    icon: initials, color: "#6366f1", title: `${mate.department || "General"} Specialist`,
    skills: base.slice(0, 4),
    voice: `You are a specialist assistant for ${mate.department || "the university"}. Your focus: ${mate.description || "help the user do their work well"}. Stay inside this focus.`,
    keywords: base,
    quick: ["Help me with this assignment", "Give me a step by step plan", "What should I check before I finish?"]
  };
}

function publicProfile(mate) {
  const p = profileOf(mate);
  return { icon: p.icon, color: p.color, title: p.title, skills: p.skills, quick: p.quick };
}

function score(task, mate) {
  const p = profileOf(mate);
  const text = ` ${String(task.title || "").toLowerCase()} ${String(task.description || "").toLowerCase()} `;
  const title = ` ${String(task.title || "").toLowerCase()} `;
  const hit = [];
  let s = 0;
  for (const k of p.keywords) {
    if (title.includes(` ${k} `)) { s += 3; hit.push(k); }
    else if (text.includes(k)) { s += 1; hit.push(k); }
  }
  if (task.overdue && (mate.name === "PlannerMate" || mate.name === "TrackMate")) s += 2;
  return { s, hit };
}

// Every task gets at least one AppMate. Best match first, up to 3.
function suggestFor(task, mates) {
  if (!mates.length) return [];
  const ranked = mates.map((m) => ({ mate: m, ...score(task, m) })).sort((a, b) => b.s - a.s);
  let picks = ranked.filter((r) => r.s > 0).slice(0, 3);
  if (!picks.length) {
    const fb = mates.find((m) => m.name === "PlannerMate") || mates[0];
    picks = [{ mate: fb, s: 0, hit: [] }];
  }
  return picks.map((r, i) => ({
    id: r.mate.id, name: r.mate.name, primary: i === 0,
    reason: r.hit.length ? `Matches: ${r.hit.slice(0, 3).join(", ")}` : "Good all round helper for planning this work"
  }));
}

module.exports = { profileOf, publicProfile, suggestFor };
