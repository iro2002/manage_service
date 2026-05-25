import { useEffect, useState, useCallback } from "react";
import { UserPlus, Search, Pencil, KeyRound, Trash2, ShieldCheck, Shield, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchUsers, deleteUser, updateUser } from "../services/userService";
import AddUserModal from "../components/Modals/AddUserModal";
import EditUserModal from "../components/Modals/EditUserModal";
import ResetPasswordModal from "../components/Modals/ResetPasswordModal";
import toast from "react-hot-toast";

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data || []);
      setApiError(null);
    } catch (err) {
      setApiError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleCloseModal = useCallback((shouldRefresh = false) => {
    setModal(null);
    if (shouldRefresh === true) loadUsers();
  }, [loadUsers]);

  const handleToggleActive = async (u) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      toast.success(`${u.name || u.email} ${u.is_active ? "deactivated" : "activated"}`);
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  const handleDelete = async (u) => {
    try {
      await deleteUser(u.id);
      toast.success(`${u.name || u.email} deleted`);
      setDeleteConfirm(null);
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Failed to delete user.");
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: users.length,
    superAdmins: users.filter((u) => u.role === "super_admin").length,
    admins: users.filter((u) => u.role === "admin").length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (apiError) {
    return (
      <div style={{
        background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
        padding: "32px 24px", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 12, textAlign: "center", maxWidth: 420, margin: "40px auto"
      }}>
        <AlertCircle size={36} style={{ color: "#dc2626" }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#b91c1c", marginBottom: 4 }}>Connection Error</div>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{apiError}</p>
          <button
            onClick={loadUsers}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", background: "#dc2626", color: "white",
              border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Stat card config
  const statCards = [
    { label: "Total Users", value: stats.total, accent: "#4f46e5", bg: "#eef2ff", iconBg: "#e0e7ff", borderColor: "#c7d2fe", icon: Shield },
    { label: "Super Admins", value: stats.superAdmins, accent: "#7c3aed", bg: "#f5f3ff", iconBg: "#ede9fe", borderColor: "#ddd6fe", icon: ShieldCheck },
    { label: "Active", value: stats.active, accent: "#16a34a", bg: "#dcfce7", iconBg: "#bbf7d0", borderColor: "#86efac", icon: Shield },
    { label: "Inactive", value: stats.inactive, accent: "#dc2626", bg: "#fef2f2", iconBg: "#fecaca", borderColor: "#fca5a5", icon: Shield },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {statCards.map(({ label, value, accent, bg, iconBg, borderColor, icon: Icon }) => (
          <div key={label} style={{
            background: "white",
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            padding: "20px 22px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            transition: "box-shadow 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"}
          >
            <div style={{
              width: 44, height: 44, background: iconBg, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Icon size={20} style={{ color: accent }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* User Table Card */}
      <div style={{
        background: "white", borderRadius: 10, border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden"
      }}>
        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #f3f4f6"
        }}>
          <div style={{ position: "relative", width: 280 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="form-input"
              id="user-search-input"
              style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
            />
          </div>
          <button
            onClick={() => setModal({ type: "add" })}
            className="btn btn-primary"
            id="add-user-btn"
          >
            <UserPlus size={14} /> Add User
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" id="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const initials = (u.name || u.email || "?").charAt(0).toUpperCase();

                  return (
                    <tr key={u.id}>
                      {/* User (avatar + name) */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32,
                            background: u.role === "super_admin" ? "#ede9fe" : "#f3f4f6",
                            color: u.role === "super_admin" ? "#7c3aed" : "#6b7280",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 700, borderRadius: 8, flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                              {u.name || "—"}
                              {isSelf && (
                                <span style={{
                                  marginLeft: 6, fontSize: 10, fontWeight: 600, color: "#4f46e5",
                                  background: "#eef2ff", padding: "1px 6px", borderRadius: 4
                                }}>YOU</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ fontSize: 13, color: "#6b7280" }}>{u.email}</td>

                      {/* Role badge */}
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                          background: u.role === "super_admin" ? "#ede9fe" : "#f3f4f6",
                          color: u.role === "super_admin" ? "#7c3aed" : "#6b7280",
                          border: `1px solid ${u.role === "super_admin" ? "#ddd6fe" : "#e5e7eb"}`
                        }}>
                          {u.role === "super_admin" ? <ShieldCheck size={12} /> : <Shield size={12} />}
                          {u.role === "super_admin" ? "Super Admin" : "Admin"}
                        </span>
                      </td>

                      {/* Status badge */}
                      <td>
                        <span style={{
                          display: "inline-block", padding: "3px 10px", borderRadius: 99,
                          fontSize: 11, fontWeight: 600,
                          background: u.is_active ? "#dcfce7" : "#fef2f2",
                          color: u.is_active ? "#16a34a" : "#dc2626",
                          border: `1px solid ${u.is_active ? "#86efac" : "#fecaca"}`
                        }}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Created date */}
                      <td style={{ fontSize: 12, color: "#9ca3af" }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric"
                        }) : "—"}
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setModal({ type: "edit", user: u })}
                            className="btn btn-ghost btn-icon"
                            title="Edit"
                            id={`edit-user-${u.id}-btn`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setModal({ type: "resetPassword", user: u })}
                            className="btn btn-ghost btn-icon"
                            title="Reset Password"
                            id={`reset-pass-${u.id}-btn`}
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className="btn btn-ghost btn-icon"
                            title={u.is_active ? "Deactivate" : "Activate"}
                            disabled={isSelf}
                            id={`toggle-active-${u.id}-btn`}
                            style={{
                              color: u.is_active ? "#d97706" : "#16a34a",
                              opacity: isSelf ? 0.3 : 1
                            }}
                          >
                            <Shield size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(u)}
                            className="btn btn-ghost btn-icon"
                            title="Delete"
                            disabled={isSelf}
                            id={`delete-user-${u.id}-btn`}
                            style={{
                              color: "#dc2626",
                              opacity: isSelf ? 0.3 : 1
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "add" && <AddUserModal onClose={handleCloseModal} />}
      {modal?.type === "edit" && (
        <EditUserModal user={modal.user} currentUserId={currentUser?.id} onClose={handleCloseModal} />
      )}
      {modal?.type === "resetPassword" && (
        <ResetPasswordModal user={modal.user} onClose={handleCloseModal} />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setDeleteConfirm(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeIn 0.15s ease-out" }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 48, height: 48, background: "#fef2f2", borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
              }}>
                <Trash2 size={22} style={{ color: "#dc2626" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Delete User</h3>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
                Are you sure you want to delete <strong>{deleteConfirm.name || deleteConfirm.email}</strong>?
                This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary" id="delete-user-cancel-btn">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} className="btn btn-danger" id="delete-user-confirm-btn">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
