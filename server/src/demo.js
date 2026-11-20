// Built-in demo answers. Used only when no GROQ_API_KEY is set, so the project works for anyone.
const { profileOf } = require("./personas");

const T = (rows) => rows.join("\n");
const PLAYBOOK = {
  academicmate: (t) => T([`### Lesson plan for: ${t}`, "| Session | Topic | Activity | Time |", "|---|---|---|---|", "| 1 | Introduction and motivation | Lecture and quick poll | 50 min |", "| 2 | Core concepts | Worked examples | 50 min |", "| 3 | Practice | Group problem solving | 50 min |", "| 4 | Review | Short quiz | 30 min |", "### Course outcome", "Students will be able to apply the concept to a new problem (Apply level)."]),
  evalmate: (t) => T([`### Rubric for: ${t}`, "| Criteria | Marks | What full marks look like |", "|---|---|---|", "| Correctness | 40 | Works for all cases |", "| Understanding | 20 | Clear explanation in own words |", "| Quality and structure | 20 | Clean and organised |", "| Testing and examples | 10 | Normal and edge cases |", "| Presentation | 10 | Neat and on time |", "The final mark is the faculty's decision."]),
  studymate: (t) => T([`### Study guide for: ${t}`, "1. Start with the basic idea in one sentence.", "2. Work through one small example by hand.", "3. Compare it with a similar idea and note the difference.", "4. Close the notes and explain it aloud.", "### Quick check", "Can you explain why this works, not just how?"]),
  projectmate: (t) => T([`### How to approach: ${t}`, "1. Write the input and output in one line.", "2. List the main parts and draw them on paper.", "3. Build the smallest working version first.", "4. Test with simple cases, then tricky ones.", "### Likely viva questions", "- Why did you choose this design?", "- What are the limits of your solution?"]),
  careermate: (t) => T(["### Career plan", "- Pick one target role and list 5 skills it needs.", "- Build one small project that shows each skill.", "- Put results with numbers in your resume.", "- Practise 2 mock interview questions daily."]),
  mentormate: (t) => T([`### Mentoring talk plan: ${t}`, "1. Start by asking how they are doing, and listen.", "2. Name one strength you have seen.", "3. Agree on two small goals for the next two weeks.", "4. Fix a date to check progress.", "For personal or health concerns, refer to the college counsellor."]),
  researchmate: (t) => T([`### Research outline for: ${t}`, "1. Problem statement and why it matters", "2. Literature review: group existing work by approach", "3. Gap and research questions", "4. Method and data", "5. Expected results and risks", "Verify every reference yourself before citing."]),
  adminmate: (t) => T([`### Circular on: ${t}`, "**Ref No:** [number]  **Date:** [date]", "**Subject:** " + t, "All concerned are informed that [details]. Kindly ensure compliance by [date].", "[Name], [Designation]"]),
  policymate: (t) => T([`### Short answer on: ${t}`, "Check it against the university statutes and the latest UGC and AICTE norms before acting.", "### Key points", "- Keep written records of decisions.", "- Follow the grievance and ethics procedures.", "### Next step", "Confirm with the registrar or legal cell."]),
  insightmate: (t) => T(["### Summary", "Use your department numbers: pass percentage, pending assignments and overdue work.", "### Action plan", "| Action | Owner | Timeline |", "|---|---|---|", "| Follow up overdue work | Faculty | This week |", "| Review low results | HOD | This month |", "| Report progress | HOD to Vice Chancellor | Monthly |"]),
  plannermate: () => T(["### Suggested day plan", "| Time | Focus |", "|---|---|", "| 9:30 to 11:00 | Overdue and high priority work |", "| 11:15 to 1:00 | Next most important assignment |", "| 2:00 to 4:00 | Remaining work and reviews |", "| 4:00 to 4:30 | Update your status |"]),
  trackmate: (t) => T(["### Progress summary", "Check the counts on your home page: pending, submitted, approved and overdue.", "### Status update to send", "Work is on track. Blockers: none. Next: finish " + t + "."]),
  writemate: (t) => T([`### Outline for: ${t}`, "1. Introduction: say what the report is about in two lines", "2. Main points: one short paragraph for each", "3. Example or evidence", "4. Conclusion: what you learned", "Write each part in your own words, then share your draft for feedback."])
};

function demoReply(mate, user, task, message) {
  const key = String(mate.name).toLowerCase();
  const p = profileOf(mate);
  const topic = task ? task.title : String(message).slice(0, 80);
  const build = PLAYBOOK[key] || ((t) => T([`### ${mate.name} suggestions for: ${t}`, "1. Define the goal clearly.", "2. Break it into small steps.", "3. Do the first step now and review."]));
  return [`**${mate.name}** (${p.title}) demo answer for ${user.name.split(" ")[0]}`, "", build(topic), "", "_Demo mode: add a GROQ_API_KEY in server/.env to get full AI answers._"].join("\n");
}

module.exports = { demoReply };
