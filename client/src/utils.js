export const STATUS = { assigned: "Assigned", "in-progress": "In progress", submitted: "Submitted", returned: "Returned for changes", approved: "Approved" };
export const ROLE = { vc: "Vice Chancellor", hod: "Head of Department", faculty: "Faculty", student: "Student" };
export const LEVELS = ["vc", "hod", "faculty", "student"];
export const when = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
export const day = (d) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No due date");
