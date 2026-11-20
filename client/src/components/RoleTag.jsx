import { ROLE } from "../utils";

export default function RoleTag({ role }) {
  return <span className={`role-tag role-${role}`}>{ROLE[role] || role}</span>;
}
