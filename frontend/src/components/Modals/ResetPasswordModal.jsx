import { useState } from "react";
import { X, Loader2, KeyRound, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { resetUserPassword } from "../../services/userService";
import toast from "react-hot-toast";

export default function ResetPasswordModal({ user, onClose }) {
  const [adminPassword, setAdminPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!adminPassword) {
      setError("Please enter your admin password to authorise this action.");
      return;
    }
    if (!password) {
      setError("New password is required.");
      return;
    }
    if (password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetUserPassword(user.id, password, adminPassword);
      toast.success(`Password reset for ${user.name || user.email}`);
      onClose(true);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => onClose(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.15s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div style={{ width: 36, height: 36, background: "#fce7f3", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <KeyRound size={18} style={{ color: "#db2777" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Reset Password</h3>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>{user.name || user.email}</p>
            </div>
          </div>
          <button onClick={() => onClose(false)} className="btn-ghost btn-icon btn" id="reset-pass-close-btn">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Error */}
          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Admin password confirmation */}
          <div style={{ background: "#fef9f0", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <ShieldAlert size={14} style={{ color: "#d97706" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#92400e" }}>Admin Authorisation Required</span>
            </div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Your Admin Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showAdminPass ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => { setAdminPassword(e.target.value); setError(""); }}
                placeholder="Enter your current password"
                className="form-input"
                id="reset-admin-pass-input"
                autoFocus
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowAdminPass(!showAdminPass)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2 }}
              >
                {showAdminPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 6 }}>New Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Minimum 6 characters"
                className="form-input"
                id="reset-pass-new-input"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2 }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 6 }}>Confirm New Password</label>
            <input
              type={showPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="Re-enter new password"
              className="form-input"
              id="reset-pass-confirm-input"
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
            <button type="button" onClick={() => onClose(false)} className="btn btn-secondary" id="reset-pass-cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" id="reset-pass-submit-btn">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Resetting…</> : <><KeyRound size={14} /> Reset Password</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
