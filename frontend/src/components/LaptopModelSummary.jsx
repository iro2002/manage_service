import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Laptop, Package, Users, Building2, PackageX, DollarSign } from "lucide-react";

const STATUS_COLORS = {
  Available:          { bg: "#dcfce7", text: "#16a34a" },
  Assigned:           { bg: "#dbeafe", text: "#2563eb" },
  "With MS":          { bg: "#ede9fe", text: "#7c3aed" },
  "With HR":          { bg: "#ede9fe", text: "#7c3aed" },
  "Returned to Vendor": { bg: "#fef3c7", text: "#d97706" },
};

function StatusPill({ label, count, colorSet }) {
  if (!count) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 999,
      background: colorSet.bg, color: colorSet.text,
      fontSize: 11, fontWeight: 600,
    }}>
      {count} {label}
    </span>
  );
}

export default function LaptopModelSummary({ laptops }) {
  const [collapsed, setCollapsed] = useState(false);

  const groups = useMemo(() => {
    const map = {};
    for (const l of laptops) {
      const model = l.model || "Unknown";
      if (!map[model]) {
        map[model] = {
          model,
          total: 0,
          available: 0,
          assigned: 0,
          withMS: 0,
          returned: 0,
          vendors: new Set(),
          totalRate: 0,
        };
      }
      const g = map[model];
      g.total++;
      if (l.status === "Available") g.available++;
      else if (l.status === "Assigned") g.assigned++;
      else if (l.status === "With MS" || l.status === "With HR") g.withMS++;
      else if (l.status === "Returned to Vendor") g.returned++;
      if (l.vendorName) g.vendors.add(l.vendorName);
      if (l.ratePerMonth && l.status !== "Returned to Vendor") g.totalRate += Number(l.ratePerMonth);
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [laptops]);

  const grandTotal = useMemo(() => groups.reduce((s, g) => s + g.totalRate, 0), [groups]);

  return (
    <div style={{
      background: "white", border: "1px solid #e5e7eb", borderRadius: 10,
      overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 20,
    }}>
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px", borderBottom: collapsed ? "none" : "1px solid #f3f4f6",
          cursor: "pointer", userSelect: "none",
          background: "#fafafa",
        }}
        onClick={() => setCollapsed(v => !v)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7, background: "#ede9fe",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Laptop size={15} style={{ color: "#6d28d9" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              Model Summary
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
              {groups.length} model{groups.length !== 1 ? "s" : ""} · {laptops.length} total laptops
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>Active Monthly Cost</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Rs {grandTotal.toLocaleString()}
            </div>
          </div>
          {collapsed
            ? <ChevronRight size={16} style={{ color: "#9ca3af" }} />
            : <ChevronDown size={16} style={{ color: "#9ca3af" }} />
          }
        </div>
      </div>

      {/* Table */}
      {!collapsed && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Model", "Total", "Status Breakdown", "Vendors", "Active Rate/Mo"].map(h => (
                  <th key={h} style={{
                    padding: "9px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 600, color: "#6b7280",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={g.model} style={{ borderBottom: i < groups.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  {/* Model */}
                  <td style={{ padding: "10px 16px", fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6, background: "#f3f4f6",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                      }}>
                        <Laptop size={13} style={{ color: "#6b7280" }} />
                      </div>
                      {g.model}
                    </div>
                  </td>

                  {/* Total */}
                  <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 28, borderRadius: 7,
                      background: "#f3f4f6", color: "#374151",
                      fontSize: 13, fontWeight: 700,
                    }}>{g.total}</span>
                  </td>

                  {/* Status Breakdown */}
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <StatusPill label="Available" count={g.available} colorSet={STATUS_COLORS.Available} />
                      <StatusPill label="Assigned" count={g.assigned} colorSet={STATUS_COLORS.Assigned} />
                      <StatusPill label="With MS" count={g.withMS} colorSet={STATUS_COLORS["With MS"]} />
                      <StatusPill label="Returned" count={g.returned} colorSet={STATUS_COLORS["Returned to Vendor"]} />
                    </div>
                  </td>

                  {/* Vendors */}
                  <td style={{ padding: "10px 16px", color: "#6b7280", fontSize: 12 }}>
                    {[...g.vendors].join(", ") || <span style={{ color: "#d1d5db" }}>—</span>}
                  </td>

                  {/* Rate */}
                  <td style={{ padding: "10px 16px", fontWeight: 600, color: g.totalRate ? "#111827" : "#d1d5db", whiteSpace: "nowrap" }}>
                    {g.totalRate ? `Rs ${g.totalRate.toLocaleString()}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer total */}
            {groups.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 700, color: "#111827", fontSize: 12 }}>
                    TOTAL
                  </td>
                  <td style={{ padding: "10px 16px", fontWeight: 700, color: "#111827" }}>
                    {laptops.length}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <StatusPill label="Available" count={groups.reduce((s,g)=>s+g.available,0)} colorSet={STATUS_COLORS.Available} />
                      <StatusPill label="Assigned" count={groups.reduce((s,g)=>s+g.assigned,0)} colorSet={STATUS_COLORS.Assigned} />
                      <StatusPill label="With MS" count={groups.reduce((s,g)=>s+g.withMS,0)} colorSet={STATUS_COLORS["With MS"]} />
                      <StatusPill label="Returned" count={groups.reduce((s,g)=>s+g.returned,0)} colorSet={STATUS_COLORS["Returned to Vendor"]} />
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px" }} />
                  <td style={{ padding: "10px 16px", fontWeight: 700, color: "#4f46e5", fontSize: 14 }}>
                    Rs {grandTotal.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
