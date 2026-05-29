import { useState } from "react";
import { X, Laptop, CalendarDays, Building2, Hash, BadgeDollarSign, MessageSquare, AlertCircle, CheckCircle2, Loader2, Edit3, Save, User, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { updateLaptop, checkUnique } from "../../services/laptopService";
import ConfirmModal from "./ConfirmModal";

const IDLE = "idle", CHECKING = "checking", OK = "ok", ERR = "err";

const safeDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
  } catch { return ""; }
};

export default function EditLaptopModal({ laptop, existingModels = [], existingVendors = [], existingRates = [], onClose }) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    model: laptop?.model || "",
    hrRefNumber: laptop?.hrRefNumber || "",
    serialNo: laptop?.serialNo || "",
    dateOfDelivery: safeDate(laptop?.dateOfDelivery),
    vendorName: laptop?.vendorName || "",
    ratePerMonth: laptop?.ratePerMonth || "",
    comments: laptop?.comments || "",
    windowsLicense: !!laptop?.windowsLicense,
    msOfficePackage: !!laptop?.msOfficePackage,
    adminAccountEnabled: laptop?.adminAccountEnabled === undefined ? true : !!laptop?.adminAccountEnabled,
    massStorageDisabled: laptop?.massStorageDisabled === undefined ? true : !!laptop?.massStorageDisabled,
  });

  const [serialStatus, setSerialStatus] = useState({ state: IDLE, msg: "" });
  const [hrRefStatus, setHrRefStatus] = useState({ state: IDLE, msg: "" });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validateUnique = async (field, value, setStatus) => {
    if (!value.trim() || value === laptop[field]) { setStatus({ state: IDLE, msg: "" }); return; }
    setStatus({ state: CHECKING, msg: "Checking…" });
    try {
      const res = await checkUnique(field, value.trim(), laptop.id);
      setStatus(res.unique ? { state: OK, msg: "Available" } : { state: ERR, msg: `Already in use by ${res.conflictingModel}` });
    } catch { setStatus({ state: IDLE, msg: "" }); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) return;
    if (!form.model.trim()) { toast.error("Model is required"); return; }
    if (!form.serialNo.trim()) { toast.error("Serial number is required"); return; }
    setLoading(true);
    try {
      const [serialOk, hrOk] = await Promise.all([
        (form.serialNo !== laptop.serialNo) ? checkUnique("serialNo", form.serialNo, laptop.id) : { unique: true },
        (form.hrRefNumber && form.hrRefNumber !== laptop.hrRefNumber) ? checkUnique("hrRefNumber", form.hrRefNumber, laptop.id) : { unique: true }
      ]);
      if (!serialOk.unique) { toast.error("Serial number already exists"); setSerialStatus({ state: ERR, msg: `Already exists on ${serialOk.conflictingModel}` }); setLoading(false); return; }
      if (!hrOk.unique) { toast.error("HR reference already exists"); setHrRefStatus({ state: ERR, msg: `Already exists on ${hrOk.conflictingModel}` }); setLoading(false); return; }
      setLoading(false);
      setShowConfirm(true);
    } catch (err) { toast.error(err.message || "Validation failed"); setLoading(false); }
  };

  const processUpdate = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await updateLaptop(laptop.id, { 
        ...form, model: form.model.trim(), serialNo: form.serialNo.trim(), 
        hrRefNumber: form.hrRefNumber.trim(), ratePerMonth: Number(form.ratePerMonth) || 0, 
        windowsLicense: form.windowsLicense, msOfficePackage: form.msOfficePackage,
        adminAccountEnabled: form.adminAccountEnabled, massStorageDisabled: form.massStorageDisabled
      });
      toast.success("Laptop updated successfully");
      onClose(true);
    } catch (err) { toast.error(err.message || "Failed to update"); setLoading(false); }
  };

  const uniqueModels = existingModels.filter(m => m !== form.model);

  const fieldStyle = {
    width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: 6, fontSize: 13, color: "#111827",
    background: isEditing ? "white" : "#f9fafb",
    outline: "none", transition: "all 0.15s", boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const getInputStyle = (status) => ({
    ...fieldStyle,
    borderColor: status.state === ERR ? "#ef4444" : status.state === OK ? "#22c55e" : "#e5e7eb",
    background: isEditing ? (status.state === ERR ? "#fef2f2" : status.state === OK ? "#f0fdf4" : "white") : "#f9fafb",
  });

  const renderStatus = (status) => {
    if (status.state === IDLE) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, color: status.state === ERR ? "#ef4444" : status.state === OK ? "#22c55e" : "#6b7280" }}>
        {status.state === ERR ? <AlertCircle size={12} /> : status.state === OK ? <CheckCircle2 size={12} /> : <Loader2 size={12} className="animate-spin" />}
        {status.msg}
      </div>
    );
  };

  const Label = ({ icon: Icon, children, required }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      <Icon size={14} style={{ color: "#6b7280" }} /> {children} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </label>
  );

  // View mode info row
  const InfoRow = ({ icon: Icon, label, value, mono }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ width: 30, height: 30, borderRadius: 6, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <Icon size={14} style={{ color: "#6b7280" }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: value ? "#111827" : "#d1d5db", wordBreak: "break-word", fontFamily: mono ? "monospace" : "inherit" }}>
          {value || "—"}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(17,24,39,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 680, maxHeight: "90vh", display: "flex", flexDirection: "column", background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Laptop size={18} style={{ color: "#0284c7" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Asset Details</h2>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>{isEditing ? "Editing asset information" : "Viewing full asset information"}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isEditing && (
              <button type="button" onClick={() => setIsEditing(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#374151" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
                <Edit3 size={13} /> Edit
              </button>
            )}
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {!isEditing ? (
            /* ── VIEW MODE ── */
            <div style={{ padding: "16px 24px" }}>
              {/* Status + Current User banner */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", marginBottom: 3 }}>Status</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#15803d" }}>{laptop.status}</div>
                </div>
                {laptop.currentUserName && (
                  <div style={{ flex: 1, padding: "12px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", marginBottom: 3 }}>Current User</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1d4ed8" }}>{laptop.currentUserName}</div>
                  </div>
                )}
                {laptop.department && (
                  <div style={{ flex: 1, padding: "12px 14px", background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", marginBottom: 3 }}>Department</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#7c3aed" }}>{laptop.department}</div>
                  </div>
                )}
              </div>

              <InfoRow icon={Laptop} label="Laptop Model" value={laptop.model} />
              <InfoRow icon={Hash} label="Serial Number" value={laptop.serialNo} mono />
              <InfoRow icon={FileText} label="HR Reference Number" value={laptop.hrRefNumber} mono />
              <InfoRow icon={CalendarDays} label="Date of Delivery" value={laptop.dateOfDelivery ? safeDate(laptop.dateOfDelivery) : ""} />
              <InfoRow icon={Building2} label="Vendor Name" value={laptop.vendorName} />
              <InfoRow icon={BadgeDollarSign} label="Monthly Rental (RM)" value={laptop.ratePerMonth ? `RM ${Number(laptop.ratePerMonth).toLocaleString()}` : ""} />
              <InfoRow icon={CalendarDays} label="Handover Date" value={laptop.handoverDate ? safeDate(laptop.handoverDate) : ""} />
              <InfoRow icon={CheckCircle2} label="Windows License" value={laptop.windowsLicense ? "Active" : "Inactive"} />
              <InfoRow icon={CheckCircle2} label="MS Office Package" value={laptop.msOfficePackage ? "Active" : "Inactive"} />
              <InfoRow icon={CheckCircle2} label="Admin Account" value={laptop.adminAccountEnabled ? "Enabled" : "Disabled"} />
              <InfoRow icon={CheckCircle2} label="Mass Storage" value={laptop.massStorageDisabled ? "Disabled" : "Enabled"} />
              <InfoRow icon={MessageSquare} label="Comments" value={laptop.comments} />
            </div>
          ) : (
            /* ── EDIT MODE ── */
            <form id="edit-form" onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
                {/* Model — full width so name is never cut */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <Label icon={Laptop} required>Laptop Model</Label>
                  <input list="edit-model-suggestions" placeholder="Dell Latitude 5520" value={form.model} onChange={set("model")} required autoComplete="off" style={fieldStyle} />
                  <datalist id="edit-model-suggestions">{uniqueModels.map(m => <option key={m} value={m} />)}</datalist>
                </div>

                <div>
                  <Label icon={Hash} required>Serial Number</Label>
                  <input placeholder="SN123456789" value={form.serialNo} onChange={set("serialNo")} onBlur={() => validateUnique("serialNo", form.serialNo, setSerialStatus)} required style={getInputStyle(serialStatus)} />
                  {renderStatus(serialStatus)}
                </div>

                <div>
                  <Label icon={Hash}>HR Reference Number</Label>
                  <input placeholder="HR-2025-001" value={form.hrRefNumber} onChange={set("hrRefNumber")} onBlur={() => validateUnique("hrRefNumber", form.hrRefNumber, setHrRefStatus)} style={getInputStyle(hrRefStatus)} />
                  {renderStatus(hrRefStatus)}
                </div>

                <div>
                  <Label icon={CalendarDays}>Delivery Date</Label>
                  <input type="date" value={form.dateOfDelivery} onChange={set("dateOfDelivery")} style={fieldStyle} />
                </div>

                <div>
                  <Label icon={Building2}>Vendor Name</Label>
                  <input list="edit-vendor-suggestions" placeholder="TechRent Pvt Ltd" value={form.vendorName} onChange={set("vendorName")} autoComplete="off" style={fieldStyle} />
                  <datalist id="edit-vendor-suggestions">{existingVendors.filter(v => v !== form.vendorName).map(v => <option key={v} value={v} />)}</datalist>
                </div>

                <div>
                  <Label icon={BadgeDollarSign}>Monthly Rental (RM)</Label>
                  <input list="edit-rate-suggestions" type="number" min="0" placeholder="1500" value={form.ratePerMonth} onChange={set("ratePerMonth")} style={fieldStyle} />
                  <datalist id="edit-rate-suggestions">{existingRates.map(r => <option key={r} value={r} />)}</datalist>
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.windowsLicense} onChange={(e) => setForm(f => ({ ...f, windowsLicense: e.target.checked }))} />
                    Windows License Active
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.msOfficePackage} onChange={(e) => setForm(f => ({ ...f, msOfficePackage: e.target.checked }))} />
                    MS Office Package Active
                  </label>
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 20, flexWrap: "wrap", marginTop: -6 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.adminAccountEnabled} onChange={(e) => setForm(f => ({ ...f, adminAccountEnabled: e.target.checked }))} />
                    Admin Account Enabled
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.massStorageDisabled} onChange={(e) => setForm(f => ({ ...f, massStorageDisabled: e.target.checked }))} />
                    Mass Storage Disabled
                  </label>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <Label icon={MessageSquare}>Comments</Label>
                  <textarea rows={3} placeholder="Condition, warranty, damage notes, accessories…" value={form.comments} onChange={set("comments")} style={{ ...fieldStyle, resize: "vertical" }} />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
          <button type="button" onClick={() => { if (isEditing) { setIsEditing(false); } else { onClose(); } }} className="btn btn-secondary">{isEditing ? "Cancel Edit" : "Close"}</button>
          {isEditing && (
            <button type="submit" form="edit-form" disabled={loading || serialStatus.state === ERR || hrRefStatus.state === ERR} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={14} />}
              {loading ? "Validating…" : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Confirm Edit"
          message={`Are you sure you want to save these changes to "${form.model}"?`}
          onConfirm={processUpdate}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
