import { useState } from "react";
import { X, ArrowLeftRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { transferLaptop, DEPARTMENTS } from "../../services/laptopService";
import { useAuth } from "../../context/AuthContext";

const today = () => new Date().toISOString().split("T")[0];
const focusField = (e) => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.1)"; };
const blurField  = (e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; };

export default function TransferLaptopModal({ laptop, onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ newUserName: "", transferDate: today(), department: laptop.department || "", comments: "" });
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.newUserName || !form.transferDate) { toast.error("New user name and transfer date are required."); return; }
    setLoading(true);
    try {
      await transferLaptop(laptop, form, user.email);
      toast.success(`Laptop transferred to ${form.newUserName}`);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to transfer laptop.");
    } finally { setLoading(false); }
  };

  const Label = ({ children, required }) => (
    <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 }}>
      {children}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
    </label>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(17,24,39,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 520, background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeftRight size={18} style={{ color: "#d97706" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Transfer Laptop</h2>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>Transfer asset to a new employee</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, background: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 18 }}>💻</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{laptop.model}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  Currently with: <strong style={{ color: "#374151" }}>{laptop.currentUserName}</strong>
                  {laptop.department && <span style={{ color: "#9ca3af" }}> · {laptop.department}</span>}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Label required>Transfer To (New User)</Label>
                <input className="form-input" placeholder="Full name of new employee" value={form.newUserName} onChange={set("newUserName")} required onFocus={focusField} onBlur={blurField} />
              </div>
              <div>
                <Label required>Transfer Date</Label>
                <input className="form-input" type="date" value={form.transferDate} onChange={set("transferDate")} required onFocus={focusField} onBlur={blurField} />
              </div>
              <div>
                <Label>New Department</Label>
                <select className="form-select" value={form.department} onChange={set("department")} onFocus={focusField} onBlur={blurField}>
                  <option value="">— Select Department —</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Label>Comments</Label>
                <textarea className="form-textarea" rows={3} placeholder="Reason for transfer or notes" value={form.comments} onChange={set("comments")} style={{ resize: "vertical" }} onFocus={focusField} onBlur={blurField} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading && <Loader2 size={13} className="animate-spin" />}
              {loading ? "Transferring…" : "Transfer Laptop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
