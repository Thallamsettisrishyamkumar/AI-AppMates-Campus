# AI AppMates Campus

A university version of AI AppMates. One connected workflow from the Vice Chancellor to every student.

## Hierarchy
Vice Chancellor, then Head of Department, then Faculty, then Student (last level).
- Every level can add people below it, at any level below, from the Organisation page.
- Each person assigns work to the people directly below them.
- Work is submitted inside the application to the person who assigned it, then reviewed with marks and remarks, and approved or returned for changes.

## AppMates by level
- Vice Chancellor: PolicyMate, InsightMate, AdminMate, ResearchMate, PlannerMate, TrackMate
- Head of Department: InsightMate, AcademicMate, AdminMate, PolicyMate, ResearchMate, MentorMate, PlannerMate, TrackMate
- Faculty: AcademicMate, EvalMate, MentorMate, ResearchMate, AdminMate, PlannerMate, TrackMate
- Student: StudyMate, ProjectMate, CareerMate, WriteMate, ResearchMate, PlannerMate, TrackMate

Every assignment is matched to the best AppMate by keywords. Student AppMates coach instead of handing over answers to copy.

## Also included
- Real database option: set `DATABASE_URL` (PostgreSQL) and data never resets. Without it, a JSON file is used.
- File upload on submissions (3 files, 3 MB each), late flag, discussion on every assignment
- Notifications inside the app, and email when `SMTP_*` is set
- Bulk assign to everyone directly below, and announcements that flow down every level
- Reports with charts, marks, CSV export and print to PDF. Early warning on the home page
- EvalMate suggests marks and feedback for a submission. AppMates can reply in English, Hindi or Telugu
- Change password, reset by the person above, login protection
- Light and dark theme, works on phones, installable as an app

## Run
1. `npm run setup`
2. Copy `server/.env.example` to `server/.env`. Add a free Groq key as `GROQ_API_KEY` for full AI answers. With no key, the built-in demo answers are used.
3. `npm run dev` and open http://localhost:5173

Demo logins, password 123456: vc@demo.com, hod@demo.com, faculty@demo.com, student@demo.com

## Deploy (Render, free)
Build command `npm run build`, start command `npm start`. Environment variables: `GROQ_API_KEY`, `GROQ_MODEL`, `JWT_SECRET`, `NODE_VERSION=20`.
