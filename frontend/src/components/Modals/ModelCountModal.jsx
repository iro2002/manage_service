import { useMemo } from "react";
import { X, Laptop } from "lucide-react";

const STATUS_COLORS = {
  Available:            { bg: "#dcfce7", text: "#16a34a" },
  Assigned:             { bg: "#dbeafe", text: "#2563eb" },
  "With MS":            { bg: "#ede9fe", text: "#7c3aed" },
  "With HR":            { bg: "#ede9fe", text: "#7c3aed" },
  "Returned to Vendor": { bg: "#fef3c7", text: "#d97706" },
};

function Pill({ count, label, color }) {
  if (!count) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 999,
      background: color.bg, color: color.text,
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {count} {label}
    </span>
  );
}

export default function ModelCountModal({ laptops, onClose }) {
  const activeLaptops = useMemo(() => laptops.filter(l => l.status !== "Returned to Vendor"), [laptops]);

  const groups = useMemo(() => {
    const map = {};
    for (const l of activeLaptops) {
      const model = l.model || "Unknown";
      if (!map[model]) {
        map[model] = { model, total: 0, vendors: new Set(), totalRate: 0 };
      }
      const g = map[model];
      g.total++;
      if (l.vendorName) g.vendors.add(l.vendorName);
      if (l.ratePerMonth) g.totalRate += Number(l.ratePerMonth);
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [activeLaptops]);

  const grandTotal   = groups.reduce((s, g) => s + g.totalRate, 0);
  const totalCount   = activeLaptops.length;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "100%", maxWidth: 820, maxHeight: "88vh", display: "flex", flexDirection: "column",
        background: "white", borderRadius: 14, overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Laptop size={17} style={{ color: "#6d28d9" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Laptop Count by Model</h2>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                {groups.length} model{groups.length !== 1 ? "s" : ""} · {totalCount} total laptops
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            <X size={15} />
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
              <tr style={{ background: "#edf0fa" }}>
                {["#", "Model", "Total", "Vendors", "Active Rate/Mo"].map(h => (
                  <th key={h} style={{
                    padding: "11px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 600, color: "#000000",
                    textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={g.model}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "11px 16px", color: "#9ca3af", fontSize: 12, fontWeight: 500 }}>{i + 1}</td>

                  <td style={{ padding: "11px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Laptop size={13} style={{ color: "#6b7280" }} />
                      </div>
                      <span style={{ fontWeight: 600, color: "#111827" }}>{g.model}</span>
                    </div>
                  </td>

                  <td style={{ padding: "11px 16px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: 8,
                      background: "#f3f4f6", color: "#111827",
                      fontSize: 13, fontWeight: 700,
                    }}>{g.total}</span>
                  </td>

                  <td style={{ padding: "11px 16px", color: "#6b7280", fontSize: 12 }}>
                    {[...g.vendors].join(", ") || <span style={{ color: "#d1d5db" }}>—</span>}
                  </td>

                  <td style={{ padding: "11px 16px", fontWeight: 600, color: g.totalRate ? "#4f46e5" : "#d1d5db", whiteSpace: "nowrap" }}>
                    {g.totalRate ? `Rs ${g.totalRate.toLocaleString()}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer total row */}
            {groups.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                  <td colSpan={2} style={{ padding: "11px 16px", fontWeight: 700, color: "#111827", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Total
                  </td>
                  <td style={{ padding: "11px 16px", fontWeight: 700, color: "#111827" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: "#e0e7ff", color: "#4f46e5", fontSize: 13, fontWeight: 700 }}>
                      {totalCount}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px" }} />
                  <td style={{ padding: "11px 16px", fontWeight: 800, color: "#4f46e5", fontSize: 15, whiteSpace: "nowrap" }}>
                    Rs {grandTotal.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", border: "1px solid #e5e7eb", borderRadius: 7, background: "white", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
