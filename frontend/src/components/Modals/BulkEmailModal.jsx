import { useState } from "react";
import { X, Mail, Loader2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { sendBulkEmail } from "../../services/laptopService";

export default function BulkEmailModal({ selectedLaptops, onClose }) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("Important update regarding your assigned laptop");
  const [message, setMessage] = useState("Please contact the Manage Service team.");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    
    setLoading(true);
    try {
      const laptopIds = selectedLaptops.map(l => l.id);
      await sendBulkEmail(laptopIds, subject, message);
      toast.success("Bulk emails sent successfully.");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to send bulk emails.");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: 6, fontSize: 13, color: "#111827",
    background: "white", outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const Label = ({ children }) => (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {children}
    </label>
  );

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(17,24,39,0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "100%", maxWidth: 500, background: "white",
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid #f3f4f6",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Mail size={18} style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Send Bulk Email</h2>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>Sending email for {selectedLaptops.length} selected laptop(s)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 6, border: "1px solid #e5e7eb",
              background: "white", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#6b7280",
            }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "#f8fafc", padding: "12px 16px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 12, color: "#475569",
              display: "flex", alignItems: "flex-start", gap: 10
            }}>
              <Users size={16} style={{ color: "#64748b", marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ color: "#1e293b", display: "block", marginBottom: 2 }}>Recipients Note:</strong>
                This will send an email to the users assigned to these laptops. If a laptop is not assigned or the user has no email address, it will be skipped.
              </div>
            </div>

            <div>
              <Label>Email Subject</Label>
              <input
                type="text"
                placeholder="e.g. Asset Audit Request"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                style={fieldStyle}
              />
            </div>

            <div>
              <Label>Email Message (HTML/Text)</Label>
              <textarea
                rows={6}
                placeholder="Write your email content here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ ...fieldStyle, resize: "vertical" }}
              />
            </div>
          </div>

          <div style={{
            display: "flex", justifyContent: "flex-end", gap: 10,
            padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa",
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {loading && <Loader2 size={13} className="animate-spin" />}
              {loading ? "Sending..." : "Send Emails"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
