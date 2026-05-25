import { useEffect, useState } from "react";
import { X, Clock, ArrowRight, User, Calendar, MessageSquare } from "lucide-react";
import { getLaptopHistory } from "../../services/laptopService";
import { format } from "date-fns";

const ACTION_THEMES = {
  Added:               { bg: "#dcfce7", color: "#15803d", dot: "#16a34a" },
  Assigned:            { bg: "#ede9fe", color: "#6d28d9", dot: "#7c3aed" },
  Transferred:         { bg: "#fef3c7", color: "#b45309", dot: "#d97706" },
  "Returned to MS":    { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626" },
  "Returned to HR":    { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626" },
  "Returned to Vendor":{ bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626" },
};
const DEFAULT_THEME = { bg: "#f3f4f6", color: "#374151", dot: "#6b7280" };

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

export default function HistoryModal({ laptop, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!laptop?.id) return;
    setLoading(true);
    getLaptopHistory(laptop.id)
      .then(setHistory)
      .catch((err) => console.error("Failed to fetch laptop history:", err))
      .finally(() => setLoading(false));
  }, [laptop?.id]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(17,24,39,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: "100%", maxWidth: 560, maxHeight: "88vh", display: "flex", flexDirection: "column", background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={18} style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Laptop History</h2>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>Lifecycle of ownership changes</p>
            </div>
          </div>
          <button onClick={onClose} id="history-close-btn" style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Device info */}
          <div style={{ display: "flex", gap: 10, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{laptop?.model || "Unknown Device"}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, display: "flex", gap: 10 }}>
                <span style={{ fontFamily: "monospace", background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>S/N: {laptop?.serialNo || "—"}</span>
                <span>Ref: {laptop?.hrRefNumber || "No HR Reference"}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 12 }}>
              <div className="spinner" />
              <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading history…</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 8, textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={20} style={{ color: "#9ca3af" }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No Activity Yet</div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>No transactions have been logged for this asset.</div>
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 20 }}>
              {/* Vertical line */}
              <div style={{ position: "absolute", left: 6, top: 8, bottom: 8, width: 1, background: "#e5e7eb" }} />

              {history.map((item, i) => {
                const theme = ACTION_THEMES[item.action] ?? DEFAULT_THEME;
                return (
                  <div key={item.id} style={{ position: "relative", marginBottom: i < history.length - 1 ? 20 : 0 }}>
                    {/* Dot */}
                    <div style={{
                      position: "absolute", left: -17, top: 3,
                      width: 10, height: 10, borderRadius: "50%",
                      background: theme.dot, border: "2px solid white",
                      boxShadow: `0 0 0 2px ${theme.dot}40`
                    }} />

                    <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 8, padding: "12px 14px" }}>
                      {/* Action + timestamp */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: theme.bg, color: theme.color,
                          fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: theme.dot }} />
                          {item.action}
                        </span>
                        <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>
                          {formatDateString(item.createdAt)}
                        </span>
                      </div>

                      {/* User transfer */}
                      {(item.fromUser || item.toUser) && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", borderRadius: 6, padding: "7px 10px", marginBottom: 8, fontSize: 12 }}>
                          <span style={{ color: "#6b7280", fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.fromUser || "Unassigned"}</span>
                          <ArrowRight size={12} style={{ color: "#d1d5db", flexShrink: 0 }} />
                          <span style={{ color: "#111827", fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.toUser || "Unassigned"}</span>
                          {item.department && <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{item.department}</span>}
                        </div>
                      )}

                      {/* Meta */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 11, color: "#9ca3af" }}>
                        {item.actionDate && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Calendar size={11} />Effective: {formatDateString(item.actionDate, "dd MMM yyyy")}
                          </span>
                        )}
                        {item.performedBy && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <User size={11} />Logged by: <strong style={{ color: "#6b7280" }}>{item.performedBy}</strong>
                          </span>
                        )}
                      </div>

                      {/* Comments */}
                      {item.comments && (
                        <div style={{ display: "flex", gap: 6, marginTop: 8, background: "#f9fafb", borderRadius: 6, padding: "7px 10px", fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
                          <MessageSquare size={12} style={{ marginTop: 1, flexShrink: 0, color: "#9ca3af" }} />
                          <span>"{item.comments}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexShrink: 0 }}>
          <button onClick={onClose} id="history-modal-close-btn" className="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}