import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Confirm", confirmStyle = "primary" }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(17,24,39,0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{
        width: "100%", maxWidth: 400, background: "white",
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        animation: "fadeIn 0.15s ease-out",
      }}>
        <div style={{ padding: "24px 24px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: confirmStyle === "danger" ? "#fee2e2" : "#ede9fe",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <AlertTriangle size={20} style={{ color: confirmStyle === "danger" ? "#dc2626" : "#6d28d9" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 6 }}>{title}</h3>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{message}</p>
            </div>
          </div>
        </div>

        <div style={{
          padding: "16px 24px", background: "#f9fafb",
          borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 10
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 16px", background: "white", border: "1px solid #d1d5db",
              borderRadius: 6, fontSize: 13, fontWeight: 500, color: "#374151",
              cursor: "pointer", transition: "all 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              background: confirmStyle === "danger" ? "#dc2626" : "#4f46e5",
              border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, color: "white",
              cursor: "pointer", transition: "all 0.15s",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={e => e.currentTarget.style.background = confirmStyle === "danger" ? "#b91c1c" : "#4338ca"}
            onMouseLeave={e => e.currentTarget.style.background = confirmStyle === "danger" ? "#dc2626" : "#4f46e5"}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
