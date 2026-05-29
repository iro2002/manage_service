import { useState } from "react";
import { X, Loader2, Pencil } from "lucide-react";
import { updateUser } from "../../services/userService";
import toast from "react-hot-toast";

export default function EditUserModal({ user, currentUserId, onClose }) {
  const [form, setForm] = useState({
    username: user.username || "",
    name: user.name || "",
    email: user.email || "",
    role: user.role || "admin",
    is_active: user.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSelf = user.id === currentUserId;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.name.trim() || !form.email.trim()) {
      setError("Username, name and email are required.");
      return;
    }

    setLoading(true);
    try {
      await updateUser(user.id, form);
      toast.success("User updated successfully!");
      onClose(true);
    } catch (err) {
      setError(err.message || "Failed to update user.");
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
              width: 36, height: 36, background: "#fef3c7", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Pencil size={18} style={{ color: "#d97706" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Edit User</h3>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>{user.email}</p>
            </div>
          </div>
          <button onClick={() => onClose(false)} className="btn-ghost btn-icon btn" id="edit-user-close-btn">
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
              placeholder="Username"
              className="form-input"
              id="edit-user-username-input"
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
              placeholder="Full Name"
              className="form-input"
              id="edit-user-name-input"
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
              placeholder="Email"
              className="form-input"
              id="edit-user-email-input"
            />
          </div>

          {/* Role */}
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 6 }}>Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="form-select"
              id="edit-user-role-select"
              disabled={isSelf}
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            {isSelf && (
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>You cannot change your own role.</p>
            )}
          </div>

          {/* Active Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{
              position: "relative", display: "inline-flex", alignItems: "center", cursor: isSelf ? "not-allowed" : "pointer"
            }}>
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                disabled={isSelf}
                id="edit-user-active-checkbox"
                style={{ width: 16, height: 16, accentColor: "#4f46e5", cursor: isSelf ? "not-allowed" : "pointer" }}
              />
              <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500, color: "#374151" }}>
                Account Active
              </span>
            </label>
            {isSelf && (
              <span style={{ fontSize: 11, color: "#9ca3af" }}>(Can't deactivate yourself)</span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
            <button type="button" onClick={() => onClose(false)} className="btn btn-secondary" id="edit-user-cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" id="edit-user-submit-btn">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Pencil size={14} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
