import { useState } from "react";
import { X, Laptop, CalendarDays, Building2, Hash, BadgeDollarSign, MessageSquare, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { addLaptop, checkUnique } from "../../services/laptopService";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

const today = () => new Date().toISOString().split("T")[0];
const IDLE = "idle", CHECKING = "checking", OK = "ok", ERR = "err";

const fieldStyle = {
  width: "100%", padding: "8px 11px", border: "1px solid #e5e7eb", borderRadius: 6,
  fontSize: 13, color: "#111827", background: "white", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s"
};

export default function AddLaptopModal({ onClose, existingModels = [], existingVendors = [], existingRates = [] }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    model: "", hrRefNumber: "", serialNo: "",
    dateOfDelivery: today(), vendorName: "", ratePerMonth: "", comments: "",
  });
  const [serialStatus, setSerialStatus] = useState({ state: IDLE, msg: "" });
  const [hrRefStatus, setHrRefStatus] = useState({ state: IDLE, msg: "" });

  const uniqueModels = [...new Set(existingModels.filter(Boolean))].sort();
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validateUnique = async (field, value, setStatus) => {
    if (!value.trim()) { setStatus({ state: IDLE, msg: "" }); return true; }
    setStatus({ state: CHECKING, msg: "Checking…" });
    try {
      const result = await checkUnique(field, value.trim());
      if (result.unique) { setStatus({ state: OK, msg: "Available" }); return true; }
      setStatus({ state: ERR, msg: `Already exists on ${result.conflictingModel}` });
      return false;
    } catch {
      setStatus({ state: ERR, msg: "Validation failed" });
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.model.trim()) { toast.error("Model is required"); return; }
    if (!form.serialNo.trim()) { toast.error("Serial number is required"); return; }
    
    setLoading(true);
    try {
      const [serialOk, hrOk] = await Promise.all([
        checkUnique("serialNo", form.serialNo.trim()),
        checkUnique("hrRefNumber", form.hrRefNumber.trim()),
      ]);
      if (!serialOk.unique) { toast.error("Serial number already exists"); setSerialStatus({ state: ERR, msg: `Already exists on ${serialOk.conflictingModel}` }); setLoading(false); return; }
      if (!hrOk.unique) { toast.error("HR reference already exists"); setHrRefStatus({ state: ERR, msg: `Already exists on ${hrOk.conflictingModel}` }); setLoading(false); return; }
      setLoading(false);
      setShowConfirm(true);
    } catch (err) {
      toast.error(err.message || "Failed to validate laptop");
      setLoading(false);
    }
  };

  const processAdd = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await addLaptop({ ...form, model: form.model.trim(), serialNo: form.serialNo.trim(), hrRefNumber: form.hrRefNumber.trim(), ratePerMonth: Number(form.ratePerMonth) || 0 }, user.email);
      toast.success("Laptop added successfully");
      onClose(true);
    } catch (err) {
      toast.error(err.message || "Failed to add laptop");
      setLoading(false);
    }
  };

  const getInputStyle = (status) => ({
    ...fieldStyle,
    borderColor: status.state === ERR ? "#fca5a5" : status.state === OK ? "#6ee7b7" : "#e5e7eb",
    boxShadow: status.state === ERR ? "0 0 0 3px rgba(239,68,68,0.08)" : status.state === OK ? "0 0 0 3px rgba(16,185,129,0.08)" : undefined
  });

  const renderStatus = (status) => {
    if (status.state === IDLE) return null;
    if (status.state === CHECKING) return <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><Loader2 size={11} className="animate-spin" />{status.msg}</span>;
    if (status.state === OK) return <span style={{ fontSize: 11, color: "#16a34a", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={11} />{status.msg}</span>;
    return <span style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><AlertCircle size={11} />{status.msg}</span>;
  };

  const Label = ({ children, icon: Icon, required }) => (
    <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
      {Icon && <Icon size={12} />}{children}{required && <span style={{ color: "#ef4444" }}>*</span>}
    </label>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(17,24,39,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "100%", maxWidth: 680, maxHeight: "92vh", display: "flex", flexDirection: "column",
        background: "white", borderRadius: 12, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Laptop size={18} style={{ color: "#6d28d9" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Add New Laptop</h2>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>Register a new company asset</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
              <div>
                <Label icon={Laptop} required>Laptop Model</Label>
                <input list="model-suggestions" placeholder="Dell Latitude 5520" value={form.model} onChange={set("model")} required autoComplete="off" style={fieldStyle} />
                {uniqueModels.length > 0 && <datalist id="model-suggestions">{uniqueModels.map(m => <option key={m} value={m} />)}</datalist>}
              </div>

              <div>
                <Label icon={Hash}>HR Reference Number</Label>
                <input placeholder="ERO/RNT/FA/LAP/0000" value={form.hrRefNumber} onChange={set("hrRefNumber")} onBlur={() => validateUnique("hrRefNumber", form.hrRefNumber, setHrRefStatus)} style={getInputStyle(hrRefStatus)} />
                {renderStatus(hrRefStatus)}
              </div>

              <div>
                <Label icon={Hash} required>Serial Number</Label>
                <input placeholder="SN123456789" value={form.serialNo} onChange={set("serialNo")} onBlur={() => validateUnique("serialNo", form.serialNo, setSerialStatus)} required style={getInputStyle(serialStatus)} />
                {renderStatus(serialStatus)}
              </div>

              <div>
                <Label icon={CalendarDays}>Delivery Date</Label>
                <input type="date" value={form.dateOfDelivery} onChange={set("dateOfDelivery")} style={fieldStyle} />
              </div>

              <div>
                <Label icon={Building2}>Vendor Name</Label>
                <input list="add-vendor-suggestions" placeholder="TechRent Pvt Ltd" value={form.vendorName} onChange={set("vendorName")} autoComplete="off" style={fieldStyle} />
                <datalist id="add-vendor-suggestions">{existingVendors.filter(v => v !== form.vendorName).map(v => <option key={v} value={v} />)}</datalist>
              </div>

              <div>
                <Label icon={BadgeDollarSign}>Monthly Rental</Label>
                <input list="add-rate-suggestions" type="number" min="0" placeholder="RS /=" value={form.ratePerMonth} onChange={set("ratePerMonth")} style={fieldStyle} />
                <datalist id="add-rate-suggestions">{existingRates.map(r => <option key={r} value={r} />)}</datalist>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <Label icon={MessageSquare}>Comments</Label>
                <textarea rows={3} placeholder="Condition, warranty, damage notes, accessories…" value={form.comments} onChange={set("comments")} style={{ ...fieldStyle, resize: "vertical" }} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading || serialStatus.state === ERR || hrRefStatus.state === ERR} className="btn btn-primary">
              {loading && <Loader2 size={13} className="animate-spin" />}
              {loading ? "Validating…" : "Add Laptop"}
            </button>
          </div>
        </form>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Confirm Laptop Addition"
          message={`Are you sure you want to add the laptop "${form.model}" with serial number ${form.serialNo}?`}
          onConfirm={processAdd}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}