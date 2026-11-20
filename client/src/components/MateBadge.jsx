// Round badge with the AppMate initials and its own colour
export default function MateBadge({ mate, size = 40 }) {
  const p = (mate && mate.profile) || { icon: "AM", color: "#6366f1" };
  return (
    <span className="mate-badge" style={{ width: size, height: size, background: p.color, fontSize: size * 0.36 }}>
      {p.icon}
    </span>
  );
}
