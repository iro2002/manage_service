import { useState } from "react";
import { X, Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { createUser } from "../../services/userService";
import toast from "react-hot-toast";

export default function AddUserModal({ onClose }) {
  const [form, setForm] = useState({ username: "", name: "", email: "", password: "", role: "admin" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.name.trim() || !form.email.trim() || !form.password) {
      setError("All fields are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await createUser(form);
      toast.success("User created successfully!");
      onClose(true);
    } catch (err) {
      setError(err.message || "Failed to create user.");
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
            <div style={{
              width: 36, height: 36, background: "#eef2ff", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <UserPlus size={18} style={{ color: "#4f46e5" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Add New User</h3>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>Create a new admin account</p>
            </div>
          </div>
          <button onClick={() => onClose(false)} className="btn-ghost btn-icon btn" id="add-user-close-btn">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div style={{
              padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, fontSize: 13, color: "#dc2626", fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {/* Username */}
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 6 }}>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder=""
              className="form-input"
              id="add-user-username-input"
              autoFocus
            />
          </div>

          {/* Name */}
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 6 }}>Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder=""
              className="form-input"
              id="add-user-name-input"
            />
          </div>

          {/* Email */}
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 6 }}>Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. name@earrow.net"
              className="form-input"
              id="add-user-email-input"
            />
          </div>

          {/* Password */}
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                name="password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="form-input"
                id="add-user-password-input"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2
                }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 6 }}>Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="form-select"
              id="add-user-role-select"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
            <button type="button" onClick={() => onClose(false)} className="btn btn-secondary" id="add-user-cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" id="add-user-submit-btn">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><UserPlus size={14} /> Create User</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
