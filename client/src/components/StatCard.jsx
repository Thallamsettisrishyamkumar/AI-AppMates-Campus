export default function StatCard({ label, value, tone = "blue" }) {
  return (
    <div className={`card stat ${tone}`}>
      <div>
        <div className="stat-value">{value}</div>
        <div className="muted">{label}</div>
      </div>
    </div>
  );
}
