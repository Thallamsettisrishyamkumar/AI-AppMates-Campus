import PageHeader from "../components/PageHeader";

const STEPS = [
  ["Build the hierarchy", "The Vice Chancellor adds Heads of Department. Each level can add people below it, down to the last level, which is Student."],
  ["Assign work", "A Head of Department assigns work to faculty. Faculty assign work to students. Each person assigns to the people directly below."],
  ["Get help from AppMates", "Every assignment shows the AppMates that match it. One tap opens the chat with the assignment already loaded."],
  ["Submit inside the application", "The student or faculty member submits the work to the person who assigned it. No email or paper is needed."],
  ["Review and approve", "The reviewer reads the submission, adds marks and remarks, then approves it or returns it for changes. EvalMate can help write the feedback."]
];
const ROLES = [
  ["Vice Chancellor", "PolicyMate, InsightMate, AdminMate, ResearchMate, PlannerMate, TrackMate"],
  ["Head of Department", "InsightMate, AcademicMate, AdminMate, PolicyMate, ResearchMate, MentorMate, PlannerMate, TrackMate"],
  ["Faculty", "AcademicMate, EvalMate, MentorMate, ResearchMate, AdminMate, PlannerMate, TrackMate"],
  ["Student", "StudyMate, ProjectMate, CareerMate, WriteMate, ResearchMate, PlannerMate, TrackMate"]
];

export default function About() {
  return (
    <>
      <PageHeader title="How it works" subtitle="One connected flow from the top of the university to every student." />
      <div className="grid3">
        {STEPS.slice(0, 3).map(([t, d], i) => <div className="card" key={t}><div className="step-no">{i + 1}</div><h4>{t}</h4><p className="muted">{d}</p></div>)}
      </div>
      <div className="grid2">
        {STEPS.slice(3).map(([t, d], i) => <div className="card" key={t}><div className="step-no">{i + 4}</div><h4>{t}</h4><p className="muted">{d}</p></div>)}
      </div>
      <h2>Also included</h2>
      <div className="grid3">
        {[
          ["Files and discussion", "Attach up to 3 files when you submit. Ask questions on each assignment. Late work is marked."],
          ["Announcements and notifications", "Notices flow down every level. Everyone gets in-app notifications, and email if the college sets it up."],
          ["Reports and early warning", "Progress, marks, CSV and print to PDF. The home page flags people who are falling behind."],
          ["EvalMate review", "Suggests marks and feedback for a submission. The reviewer always decides."],
          ["Hindi and Telugu", "AppMates can reply in English, Hindi or Telugu. Change it in Settings."],
          ["Safe accounts", "Password change, reset by the person above, login protection, and your data stays in your own database."]
        ].map(([t, d]) => <div className="card info" key={t}><h4>{t}</h4><p className="muted">{d}</p></div>)}
      </div>
      <h2>AppMates by level</h2>
      <div className="card table-card">
        <table className="table">
          <thead><tr><th>Level</th><th>AppMates</th></tr></thead>
          <tbody>{ROLES.map(([r, m]) => <tr key={r}><td><b>{r}</b></td><td className="muted">{m}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="card note"><b>Good to know:</b> AppMates guide and draft. For graded work they coach students instead of giving answers to copy. Marks, policy and approvals stay with the people in charge.</div>
    </>
  );
}
