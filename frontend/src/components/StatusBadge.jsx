export default function StatusBadge({ status }) {
  const map = {
    Available:            { bg: "#dcfce7", color: "#15803d", dot: "#16a34a", label: "Available" },
    Assigned:             { bg: "#ede9fe", color: "#6d28d9", dot: "#7c3aed", label: "Assigned" },
    "With MS":            { bg: "#fef3c7", color: "#b45309", dot: "#d97706", label: "With MS" },
    "Returned to Vendor": { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626", label: "Returned to Vendor" },
    "With HR":            { bg: "#fef3c7", color: "#b45309", dot: "#d97706", label: "With MS" },
  };

  const theme = map[status] ?? { bg: "#f3f4f6", color: "#374151", dot: "#6b7280", label: status };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: theme.bg, color: theme.color,
      fontSize: 11, fontWeight: 600, lineHeight: 1,
      padding: "4px 8px", borderRadius: 4,
      letterSpacing: "0.03em", whiteSpace: "nowrap"
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: theme.dot, flexShrink: 0
      }} />
      {theme.label}
    </span>
  );
}
