import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock, ArrowRight, User, Calendar, MessageSquare,
  ArrowLeft, Search, RefreshCw, Filter, ChevronDown
} from "lucide-react";
import { getLaptopHistory, fetchLaptops } from "../services/laptopService";
import { format } from "date-fns";

// ─── Action color themes ─────────────────────────────────────────────────────
const ACTION_THEMES = {
  Added:                { bg: "#dcfce7", color: "#15803d", dot: "#16a34a", border: "#86efac" },
  Assigned:             { bg: "#ede9fe", color: "#6d28d9", dot: "#7c3aed", border: "#c4b5fd" },
  Transferred:          { bg: "#fef3c7", color: "#b45309", dot: "#d97706", border: "#fcd34d" },
  "Returned to MS":     { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626", border: "#fca5a5" },
  "Returned to HR":     { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626", border: "#fca5a5" },
  "Returned to Vendor": { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626", border: "#fca5a5" },
};
const DEFAULT_THEME = { bg: "#f3f4f6", color: "#374151", dot: "#6b7280", border: "#d1d5db" };

const formatDateString = (value, pattern = "dd MMM yyyy, HH:mm") => {
  if (!value) return "—";
  if (typeof value === "object" && typeof value.toDate === "function") {
    try { return format(value.toDate(), pattern); } catch { return "—"; }
  }
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : format(d, pattern);
  } catch { return value; }
};

// ─── Single History Event Card ────────────────────────────────────────────────
function HistoryEventCard({ item, isLast }) {
  const theme = ACTION_THEMES[item.action] ?? DEFAULT_THEME;
  return (
    <div style={{ position: "relative", paddingLeft: 28, marginBottom: isLast ? 0 : 16 }}>
      {/* Vertical connector line */}
      {!isLast && (
        <div style={{
          position: "absolute", left: 8, top: 20, bottom: -16,
          width: 2, background: "linear-gradient(to bottom, #e5e7eb, #f9fafb)"
        }} />
      )}
      {/* Timeline dot */}
      <div style={{
        position: "absolute", left: 3, top: 14,
        width: 12, height: 12, borderRadius: "50%",
        background: theme.dot, border: "2.5px solid white",
        boxShadow: `0 0 0 3px ${theme.dot}30`
      }} />

      <div style={{
        background: "white",
        border: `1px solid #f0f0f0`,
        borderLeft: `3px solid ${theme.dot}`,
        borderRadius: 10,
        padding: "14px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.15s",
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
        onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"}
      >
        {/* Action badge + timestamp */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: theme.bg, color: theme.color,
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
            border: `1px solid ${theme.border}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: theme.dot }} />
            {item.action}
          </span>
          <span style={{
            fontSize: 11, color: "#9ca3af", fontFamily: "monospace",
            background: "#f9fafb", padding: "3px 8px", borderRadius: 4, border: "1px solid #f3f4f6"
          }}>
            {formatDateString(item.createdAt)}
          </span>
        </div>

        {/* User transfer flow */}
        {(item.fromUser || item.toUser) && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#f9fafb", borderRadius: 8, padding: "8px 12px",
            marginBottom: 10, fontSize: 12, border: "1px solid #f3f4f6"
          }}>
            <User size={12} style={{ color: "#9ca3af", flexShrink: 0 }} />
            <span style={{ color: "#6b7280", fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.fromUser || "Unassigned"}
            </span>
            <ArrowRight size={12} style={{ color: "#d1d5db", flexShrink: 0 }} />
            <span style={{ color: "#111827", fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.toUser || "Unassigned"}
            </span>
            {item.department && (
              <span style={{
                fontSize: 10, color: "#6b7280", background: "#f3f4f6",
                padding: "2px 7px", borderRadius: 4, flexShrink: 0, border: "1px solid #e5e7eb"
              }}>
                {item.department}
              </span>
            )}
          </div>
        )}

        {/* Meta info row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", fontSize: 11, color: "#9ca3af" }}>
          {item.actionDate && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={11} />
              Effective: <strong style={{ color: "#6b7280", marginLeft: 2 }}>{formatDateString(item.actionDate, "dd MMM yyyy")}</strong>
            </span>
          )}
          {item.performedBy && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <User size={11} />
              Logged by: <strong style={{ color: "#6b7280", marginLeft: 2 }}>{item.performedBy}</strong>
            </span>
          )}
        </div>

        {/* Comments */}
        {item.comments && (
          <div style={{
            display: "flex", gap: 8, marginTop: 10,
            background: "#f9fafb", borderRadius: 8, padding: "8px 12px",
            fontSize: 12, color: "#6b7280", fontStyle: "italic",
            border: "1px solid #f3f4f6"
          }}>
            <MessageSquare size={12} style={{ marginTop: 1, flexShrink: 0, color: "#9ca3af" }} />
            <span>"{item.comments}"</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main History Page ────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { laptopId } = useParams();
  const navigate = useNavigate();

  const [laptop, setLaptop] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allLaptops, hist] = await Promise.all([
        fetchLaptops(),
        getLaptopHistory(laptopId),
      ]);
      const found = allLaptops.find(l => String(l.id) === String(laptopId));
      setLaptop(found || null);
      setHistory(hist || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }, [laptopId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = history.filter(item => {
    const term = search.toLowerCase();
    const matchSearch = !term ||
      item.action?.toLowerCase().includes(term) ||
      item.fromUser?.toLowerCase().includes(term) ||
      item.toUser?.toLowerCase().includes(term) ||
      item.department?.toLowerCase().includes(term) ||
      item.performedBy?.toLowerCase().includes(term) ||
      item.comments?.toLowerCase().includes(term);
    const matchAction = !actionFilter || item.action === actionFilter;
    return matchSearch && matchAction;
  });

  const uniqueActions = [...new Set(history.map(h => h.action).filter(Boolean))];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "4px 0 32px" }}>

      {/* Back button + header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
        <button
          onClick={() => navigate("/laptops")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", fontSize: 13, fontWeight: 500,
            background: "white", border: "1px solid #e5e7eb", borderRadius: 8,
            color: "#374151", cursor: "pointer", flexShrink: 0, marginTop: 2,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            transition: "all 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, background: "#dbeafe",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Clock size={18} style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                Asset History
              </h2>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0, marginTop: 2 }}>
                Full lifecycle of ownership changes and events
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          title="Refresh"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb",
            background: "white", cursor: "pointer", color: "#6b7280", flexShrink: 0,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)", transition: "all 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#111827"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#6b7280"; }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Laptop info card */}
      {laptop && (
        <div style={{
          background: "white", border: "1px solid #e5e7eb", borderRadius: 12,
          padding: "16px 20px", marginBottom: 20,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap"
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <span style={{ fontSize: 18 }}>💻</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{laptop.model || "Unknown Device"}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
              {laptop.serialNo && (
                <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace", background: "#f3f4f6", padding: "2px 7px", borderRadius: 4 }}>
                  S/N: {laptop.serialNo}
                </span>
              )}
              {laptop.hrRefNumber && (
                <span style={{ fontSize: 11, color: "#6b7280" }}>Ref: {laptop.hrRefNumber}</span>
              )}
              {laptop.status && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: laptop.status === "Assigned" ? "#2563eb" : laptop.status === "Available" ? "#16a34a" : "#b45309",
                  background: laptop.status === "Assigned" ? "#dbeafe" : laptop.status === "Available" ? "#dcfce7" : "#fef3c7",
                  padding: "2px 8px", borderRadius: 999
                }}>
                  {laptop.status}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: "#9ca3af" }}>
            <div style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>{history.length}</div>
            <div>total event{history.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
      )}

      {/* Search + Filter toolbar */}
      <div style={{
        background: "white", border: "1px solid #e5e7eb", borderRadius: 10,
        padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexWrap: "wrap"
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={13} style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "#9ca3af", pointerEvents: "none"
          }} />
          <input
            type="text"
            placeholder="Search events, users, comments…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13,
              color: "#111827", background: "#f9fafb", outline: "none", fontFamily: "inherit",
              transition: "border-color 0.15s, background 0.15s", boxSizing: "border-box"
            }}
            onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.background = "white"; }}
            onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#f9fafb"; }}
          />
        </div>

        {/* Action filter */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px", fontSize: 13, fontWeight: 500,
              background: actionFilter ? "#ede9fe" : "white",
              border: `1px solid ${actionFilter ? "#c4b5fd" : "#e5e7eb"}`,
              borderRadius: 7, color: actionFilter ? "#6d28d9" : "#374151",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s"
            }}
          >
            <Filter size={13} />
            {actionFilter || "All Actions"}
            <ChevronDown size={12} style={{ transform: filterOpen ? "rotate(180deg)" : "none", transition: "0.15s" }} />
          </button>
          {filterOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
              background: "white", border: "1px solid #e5e7eb", borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.10)", minWidth: 180, overflow: "hidden"
            }}>
              {["", ...uniqueActions].map(action => (
                <button
                  key={action || "_all"}
                  onClick={() => { setActionFilter(action); setFilterOpen(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "9px 14px", fontSize: 13, fontWeight: action === actionFilter ? 600 : 400,
                    color: action === actionFilter ? "#4f46e5" : "#374151",
                    background: action === actionFilter ? "#f5f3ff" : "transparent",
                    border: "none", cursor: "pointer", fontFamily: "inherit", transition: "background 0.1s"
                  }}
                  onMouseEnter={e => { if (action !== actionFilter) e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={e => { if (action !== actionFilter) e.currentTarget.style.background = "transparent"; }}
                >
                  {action || "All Actions"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Result count */}
        <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
          {filtered.length} of {history.length} event{history.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 14 }}>
          <div className="spinner" />
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading history…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "white", border: "1px solid #e5e7eb", borderRadius: 12,
          padding: "60px 24px", textAlign: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, background: "#f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px"
          }}>
            <Clock size={22} style={{ color: "#9ca3af" }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            {history.length === 0 ? "No Activity Yet" : "No matching events"}
          </div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>
            {history.length === 0
              ? "No transactions have been logged for this asset."
              : "Try adjusting your search or filter."}
          </div>
        </div>
      ) : (
        <div style={{
          background: "white", border: "1px solid #e5e7eb", borderRadius: 12,
          padding: "24px 20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
        }}>
          <div style={{ position: "relative" }}>
            {filtered.map((item, i) => (
              <HistoryEventCard key={item.id ?? i} item={item} isLast={i === filtered.length - 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
